-- BLINDER :: servidor principal (rodadas, quebráveis, armários, monstro, economia)
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local SS = game:GetService("ServerStorage")
local CS = game:GetService("CollectionService")
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")

local Shared = RS:WaitForChild("Blinder")
local Config = require(Shared.Config)
local Remotes = Shared.Remotes
local Data = require(script.Parent.DataService)
local Factory = require(script.Parent.MonsterFactory)
local MonsterAI = require(script.Parent.MonsterAI)
local Nav = require(script.Parent.Nav)

Players.RespawnTime = 4

-- ================== Mapa ==================
local mapStore = SS.Blinder:FindFirstChild("Maps") or Instance.new("Folder")
mapStore.Name = "Maps"; mapStore.Parent = SS.Blinder
if workspace:FindFirstChild("Map") then
	local m = workspace.Map
	m.Name = "Mansion"
	m.Parent = mapStore
end
local lobby = workspace:WaitForChild("Lobby")
local lobbySpawn = lobby:WaitForChild("LobbySpawn")

-- mapas grandes gerados (mais jogadores) + lobby de terror com telões TOP GLOBAL
local Builders = require(SS.Blinder.Builders)
do
	local ok, err = pcall(Builders.BuildAllMaps, mapStore)
	if not ok then warn("[BLINDER] mapas gerados falharam, usando os antigos: " .. tostring(err)) end
end
local globalBoards = {}
do
	local ok, boards = pcall(Builders.BuildLobbyHorror, lobby, lobbySpawn)
	if ok and boards then globalBoards = boards else warn("[BLINDER] lobby de terror falhou: " .. tostring(boards)) end
end

-- ================== Estado ==================
local Round = {
	phase = "Intermission",
	map = nil :: Model?,
	monsterAI = nil,
	monsterPlayer = nil :: Player?,
	exitsOpen = false,
}
local PState: { [Player]: any } = {}          -- estado da rodada por jogador
local lockerOcc: { [Model]: Player } = {}       -- armário -> quem está dentro
local pendingGame: { [Player]: any } = {}       -- minigame do armário em andamento
local lockerGameCD: { [Player]: number } = {}
local lastHit: { [Player]: number } = {}
local lastAttack: { [Player]: number } = {}

local function setG(k, v) Shared:SetAttribute(k, v) end
local function notify(plr: Player?, text: string, kind: string?)
	if plr then Remotes.Notify:FireClient(plr, text, kind or "info") else Remotes.Notify:FireAllClients(text, kind or "info") end
end

local function giveXP(plr: Player, amount: number)
	if amount <= 0 or not plr.Parent then return end
	local ups = Data.AddXP(plr, amount)
	notify(plr, "+" .. math.floor(amount) .. " XP", "xp")
	if ups > 0 then
		notify(plr, "NÍVEL " .. (plr:GetAttribute("Level") or "?") .. "!  +" .. ups .. " ponto(s) de habilidade", "level")
	end
end

local function rootOf(plr: Player): BasePart?
	local c = plr.Character
	return c and c:FindFirstChild("HumanoidRootPart") :: BasePart?
end
local function humOf(plr: Player): Humanoid?
	local c = plr.Character
	return c and c:FindFirstChildOfClass("Humanoid")
end

-- ================== Sangue (leve e realista) ==================
local bloodParams = RaycastParams.new()
bloodParams.FilterType = Enum.RaycastFilterType.Include
local function bloodFolder(): Instance?
	local map = Round and Round.map
	if not map then return nil end
	local f = map:FindFirstChild("BloodFx")
	if not f then f = Instance.new("Folder"); f.Name = "BloodFx"; f.Parent = map end
	return f
end
local function floorBelow(pos: Vector3): Vector3?
	local map = Round and Round.map
	if not map then return nil end
	bloodParams.FilterDescendantsInstances = { map:FindFirstChild("Structure") or map }
	local hit = workspace:Raycast(pos + Vector3.new(0, 1, 0), Vector3.new(0, -12, 0), bloodParams)
	return hit and hit.Normal.Y > 0.7 and hit.Position or nil
end
local function bloodSplatAt(pos: Vector3, scale: number, dir: number?)
	local f = bloodFolder(); if not f then return end
	if #f:GetChildren() > 140 then return end
	local fl = floorBelow(pos)
	if fl then pcall(Builders.BloodSplat, f, CFrame.new(fl), scale, { dir = dir }) end
end
local function bloodWallNear(pos: Vector3, scale: number)
	local f = bloodFolder(); local map = Round and Round.map
	if not f or not map then return end
	bloodParams.FilterDescendantsInstances = { map:FindFirstChild("Structure") or map }
	local best
	for k = 0, 7 do
		local a = k / 8 * math.pi * 2
		local hit = workspace:Raycast(pos, Vector3.new(math.cos(a), 0, math.sin(a)) * 6, bloodParams)
		if hit and math.abs(hit.Normal.Y) < 0.3 and (not best or hit.Distance < best.Distance) then best = hit end
	end
	if best then
		local n = best.Normal
		pcall(Builders.BloodSplat, f, CFrame.fromMatrix(best.Position + n * 0.04, n:Cross(Vector3.yAxis).Unit, n), scale, { wall = true })
	end
end
-- sangue pingando da boca do monstro
local function addDrool(model: Model)
	local head = model:FindFirstChild("Head", true)
	if not head or not head:IsA("BasePart") or head:FindFirstChild("Drool") then return end
	local at = Instance.new("Attachment"); at.Name = "Drool"
	at.Position = Vector3.new(0, -head.Size.Y * 0.38, -head.Size.Z * 0.42)
	at.Parent = head
	local pe = Instance.new("ParticleEmitter")
	pe.Texture = "rbxasset://textures/particles/smoke_main.dds"
	pe.Color = ColorSequence.new(Color3.fromRGB(110, 6, 10), Color3.fromRGB(60, 2, 4))
	pe.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(0.3, 0.14), NumberSequenceKeypoint.new(1, 0.06) })
	pe.Transparency = NumberSequence.new(0.05, 0.3)
	pe.Lifetime = NumberRange.new(0.6, 1.0); pe.Rate = 5; pe.Speed = NumberRange.new(0.2, 0.6)
	pe.SpreadAngle = Vector2.new(10, 10); pe.Acceleration = Vector3.new(0, -45, 0); pe.EmissionDirection = Enum.NormalId.Bottom
	pe.LightInfluence = 1; pe.LightEmission = 0; pe.Parent = at
end

local function survivors(): { Player }
	local t = {}
	for plr, st in pairs(PState) do
		if st.alive and not st.escaped and plr:GetAttribute("Role") == "Survivor" and plr.Parent then
			local h = humOf(plr)
			if h and h.Health > 0 then table.insert(t, plr) end
		end
	end
	return t
end

local function lockerOf(plr: Player): Model?
	for l, p in pairs(lockerOcc) do if p == plr then return l end end
	return nil
end

local function teleportToLobby(plr: Player)
	local c = plr.Character
	if c then c:PivotTo(lobbySpawn.CFrame * CFrame.new(math.random(-3, 3), 3.5, math.random(-3, 3))) end
end

-- ================== Ruído ==================
local lastNoise: { [Player]: { pos: Vector3, t: number } } = {}
local function emitNoise(pos: Vector3, radius: number, source: Player?)
	if source and radius >= 20 then lastNoise[source] = { pos = pos, t = os.clock() } end
	if Round.monsterAI then Round.monsterAI:Hear(pos, radius, source) end
	local mp = Round.monsterPlayer
	if mp and mp ~= source then
		local r = rootOf(mp)
		local typeDef = Config.GetMonster(mp:GetAttribute("MonsterType") or "Blinder")
		local hear = typeDef.stats.hear * (Data.HasSkill(mp, "M_Ears") and 1.3 or 1)
		if r and (r.Position - pos).Magnitude <= radius * hear then
			Remotes.NoisePing:FireClient(mp, pos, radius)
		end
	end
end

-- ================== Martelo visível para os outros ==================
local Assets = Shared:WaitForChild("Assets")
local MarketplaceService = game:GetService("MarketplaceService")

local function giveHammer(char: Model, force: boolean?)
	local hand = char:FindFirstChild("RightHand") or char:FindFirstChild("Right Arm")
	if not hand then return end
	local old = char:FindFirstChild("HammerModel")
	if old and not force then return end
	if old then old:Destroy() end
	local plr = Players:GetPlayerFromCharacter(char)
	local skin = plr and plr:GetAttribute("HammerSkin")
	local skins = Assets:FindFirstChild("HammerSkins")
	local src = (skin and skin ~= "Default" and skins and skins:FindFirstChild(skin)) or Assets:FindFirstChild("Hammer")
	if not src then return end
	local rotY = math.rad(src:GetAttribute("RotY") or 0)
	local s = 0.78
	local hm = src:Clone()
	hm.Name = "HammerModel"
	hm.Size = src.Size * s
	hm.Anchored = false; hm.CanCollide = false; hm.CanQuery = false; hm.CanTouch = false; hm.Massless = true
	-- cabo para a frente da mão, face de bater para baixo
	local X, Y, Z = Vector3.new(0, -1, 0), Vector3.new(0, 0, -1), Vector3.new(1, 0, 0)
	local w = Instance.new("Weld"); w.Part0 = hand :: BasePart; w.Part1 = hm
	w.C0 = CFrame.fromMatrix(Vector3.new(0, -0.15, -0.85 * s), X, Y, Z) * CFrame.Angles(0, rotY, 0)
	w.Parent = hm
	hm.Parent = char
end

-- troca de skin do martelo em tempo real
local function watchHammerSkin(plr: Player)
	plr:GetAttributeChangedSignal("HammerSkin"):Connect(function()
		local c = plr.Character
		if c and c:FindFirstChild("HammerModel") then giveHammer(c, true) end
	end)
end
Players.PlayerAdded:Connect(watchHammerSkin)
for _, p in ipairs(Players:GetPlayers()) do watchHammerSkin(p) end

-- ================== Lanterna de cabeça ==================
local function hasFlashlight(plr: Player): boolean
	return plr:GetAttribute("OwnsFlashlight") == true or plr:GetAttribute("RoundFlashlight") == true
end

local function updateHeadlamp(plr: Player)
	local has = hasFlashlight(plr)
	plr:SetAttribute("HasFlashlight", has)
	if not has then plr:SetAttribute("FlashlightOn", false) end
	local char = plr.Character
	if not char then return end
	local head = char:FindFirstChild("Head") :: BasePart
	local existing = char:FindFirstChild("HeadLampModel")
	if not has or not head or plr:GetAttribute("Role") == "Monster" then
		if existing then existing:Destroy() end
		return
	end
	if not existing then
		local src = Assets:FindFirstChild("HeadLamp")
		if not src then return end
		local k = head.Size.X / 1.2
		existing = Instance.new("Model"); existing.Name = "HeadLampModel"
		local strap = src:Clone(); strap.Name = "Strap"; strap.Size = src.Size * 1.12 * k
		strap.Anchored = false; strap.CanCollide = false; strap.CanQuery = false; strap.CanTouch = false; strap.Massless = true
		local w = Instance.new("Weld"); w.Part0 = head; w.Part1 = strap; w.C0 = CFrame.new(0, 0.2 * k, 0.02); w.Parent = strap
		strap.Parent = existing
		local lens = Instance.new("Part"); lens.Name = "Lens"; lens.Shape = Enum.PartType.Cylinder; lens.Size = Vector3.new(0.06, 0.3 * k, 0.3 * k)
		lens.CanCollide = false; lens.CanQuery = false; lens.CanTouch = false; lens.Massless = true; lens.CastShadow = false
		local wl = Instance.new("Weld"); wl.Part0 = head; wl.Part1 = lens; wl.C0 = CFrame.new(0, 0.24 * k, -0.78 * k) * CFrame.Angles(0, math.rad(90), 0); wl.Parent = lens
		lens.Parent = existing
		local beam = Instance.new("Part"); beam.Name = "Beam"; beam.Size = Vector3.new(0.1, 0.1, 0.1); beam.Transparency = 1
		beam.CanCollide = false; beam.CanQuery = false; beam.CanTouch = false; beam.Massless = true; beam.CastShadow = false
		local wb = Instance.new("Weld"); wb.Part0 = head; wb.Part1 = beam; wb.C0 = CFrame.new(0, 0.24 * k, -0.9 * k) * CFrame.Angles(math.rad(-6), 0, 0); wb.Parent = beam
		local spot = Instance.new("SpotLight"); spot.Face = Enum.NormalId.Front; spot.Angle = 52; spot.Range = 52; spot.Brightness = 3.2
		spot.Color = Color3.fromRGB(255, 244, 222); spot.Shadows = true; spot.Parent = beam
		beam.Parent = existing
		existing.Parent = char
	end
	local on = plr:GetAttribute("FlashlightOn") == true
	local beam = existing:FindFirstChild("Beam")
	local spot = beam and beam:FindFirstChildOfClass("SpotLight")
	if spot then spot.Enabled = on end
	local lens = existing:FindFirstChild("Lens") :: BasePart
	if lens then
		lens.Material = on and Enum.Material.Neon or Enum.Material.Glass
		lens.Color = on and Color3.fromRGB(255, 246, 225) or Color3.fromRGB(70, 72, 78)
	end
end

-- ================== Armários ==================
local function hide(plr: Player, locker: Model)
	if lockerOcc[locker] or plr:GetAttribute("Hiding") then return end
	local r = rootOf(plr); if not r then return end
	lockerOcc[locker] = plr
	plr:SetAttribute("Hiding", locker:GetAttribute("LId"))
	local back = locker.PrimaryPart :: BasePart
	local hp = locker:FindFirstChild("HidePoint") :: BasePart
	r.Anchored = true
	plr.Character:PivotTo(CFrame.new(hp.Position) * back.CFrame.Rotation)
	local s = Instance.new("Sound"); s.SoundId = Config.Sounds.Locker; s.Volume = 1.2; s.Parent = back; s:Play()
	game:GetService("Debris"):AddItem(s, 4)
	emitNoise(back.Position, 10, plr)
end

local function unhide(plr: Player, kicked: boolean?)
	local locker = lockerOf(plr)
	if not locker then plr:SetAttribute("Hiding", nil); return end
	lockerOcc[locker] = nil
	plr:SetAttribute("Hiding", nil)
	local r = rootOf(plr)
	if r then
		local back = locker.PrimaryPart :: BasePart
		if not kicked then plr.Character:PivotTo(back.CFrame * CFrame.new(0, 1.5, -5)) end
		r.Anchored = false
	end
end

local function nearestOccupiedLocker(pos: Vector3, range: number): Model?
	local best, bd = nil, range
	for l in pairs(lockerOcc) do
		if l.Parent then
			local d = (l:GetPivot().Position - pos).Magnitude
			if d < bd then best, bd = l, d end
		end
	end
	return best
end

-- roda o minigame no cliente e espera o resultado (yield)
local function runMinigame(plr: Player, difficulty: string): boolean
	if pendingGame[plr] then
		-- já tem um rodando: espera ele acabar
		local t0 = os.clock()
		while pendingGame[plr] and os.clock() - t0 < 12 do task.wait(0.1) end
		return pendingGame[plr] == nil and (PState[plr] and PState[plr].lastGameResult) or false
	end
	local token = HttpService:GenerateGUID(false)
	local entry = { token = token, result = nil }
	pendingGame[plr] = entry
	Remotes.LockerMinigame:FireClient(plr, token, difficulty, Data.Upgrade(plr, "Lungs"), Data.HasSkill(plr, "S_Shadow") and 1 or 0)
	local t0 = os.clock()
	while entry.result == nil and os.clock() - t0 < 11 and plr.Parent and plr:GetAttribute("Hiding") do task.wait(0.05) end
	pendingGame[plr] = nil
	lockerGameCD[plr] = os.clock() + 7
	local ok = entry.result == true
	if not plr:GetAttribute("Hiding") then ok = true end -- saiu do armário, nada a checar
	if PState[plr] then PState[plr].lastGameResult = ok end
	if not ok then
		local l = lockerOf(plr)
		if l then emitNoise(l:GetPivot().Position, Config.NOISE.LockerFail, plr) end
	end
	return ok
end

Remotes.LockerResult.OnServerEvent:Connect(function(plr, token, success)
	local e = pendingGame[plr]
	if e and e.token == token and e.result == nil then e.result = success == true end
end)

local kill -- forward

local function openLocker(locker: Model, killer: Instance?)
	local door = locker:FindFirstChild("Door") :: BasePart
	if not door or locker:GetAttribute("Opening") then return end
	locker:SetAttribute("Opening", true)
	local closed = door.CFrame
	local hinge = closed * CFrame.new(-1.9, 0, 0)
	local opened = hinge * CFrame.Angles(0, math.rad(-105), 0) * CFrame.new(1.9, 0, 0)
	local s = Instance.new("Sound"); s.SoundId = Config.Sounds.Locker; s.Volume = 2; s.PlaybackSpeed = 0.8; s.Parent = door; s:Play()
	game:GetService("Debris"):AddItem(s, 4)
	TweenService:Create(door, TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { CFrame = opened }):Play()
	local victim = lockerOcc[locker]
	if victim then
		unhide(victim, true)
		kill(victim, killer)
	end
	task.delay(2.2, function()
		if door.Parent then TweenService:Create(door, TweenInfo.new(0.5), { CFrame = closed }):Play() end
		task.wait(0.6)
		locker:SetAttribute("Opening", nil)
	end)
end

local function checkLocker(locker: Model, difficulty: string): boolean
	local occ = lockerOcc[locker]
	if not occ then
		if math.random() < 0.35 then task.spawn(openLocker, locker, nil) end -- abre vazio só para assustar
		return true
	end
	return runMinigame(occ, difficulty)
end

-- ================== Morte ==================
kill = function(plr: Player, killer: Instance?)
	local h = humOf(plr)
	if not h or h.Health <= 0 or plr:GetAttribute("Dying") then return end
	plr:SetAttribute("Dying", true)
	task.delay(3, function() plr:SetAttribute("Dying", nil) end)
	local st = PState[plr]
	if st then st.killedBy = killer end
	local skin = killer and killer:GetAttribute("Skin") or "Blinder"
	Remotes.Jumpscare:FireClient(plr, skin)
	-- animação de "pegar" no mundo (todos os clientes veem o monstro agarrar e erguer a vítima)
	if killer then
		killer:SetAttribute("KillAt", workspace:GetServerTimeNow())
		local vr = rootOf(plr)
		local kr = killer:FindFirstChild("HumanoidRootPart") :: BasePart?
		if vr and kr then
			vr.Anchored = true
			local look = CFrame.lookAt(kr.Position, Vector3.new(vr.Position.X, kr.Position.Y, vr.Position.Z))
			pcall(function() kr.CFrame = look end)
			local grab = look * CFrame.new(0, 2.5, -3.2) * CFrame.Angles(0, math.pi, 0)
			TweenService:Create(vr, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { CFrame = grab }):Play()
		end
	end
	task.delay(1.1, function()
		local vr = rootOf(plr)
		if vr then
			local kr = killer and killer:FindFirstChild("HumanoidRootPart") :: BasePart?
			local dir = kr and math.atan2((vr.Position - kr.Position).Z, (vr.Position - kr.Position).X) or nil
			bloodSplatAt(vr.Position, 1.0, dir)
			bloodWallNear(vr.Position + Vector3.new(0, 1.5, 0), 0.75)
		end
		if h.Parent then h.Health = 0 end
	end)
	if Round.monsterPlayer and killer == Round.monsterPlayer.Character then
		Data.AddMoney(Round.monsterPlayer, Config.MONSTER_KILL_REWARD)
		Data.Inc(Round.monsterPlayer, "Kills")
		giveXP(Round.monsterPlayer, Config.XP.MonsterKill)
		notify(Round.monsterPlayer, "+$" .. Config.MONSTER_KILL_REWARD .. "  " .. plr.DisplayName .. " foi devorado", "money")
	end
end

local function onDied(plr: Player)
	local st = PState[plr]
	unhide(plr, true)
	if not st or not st.alive or st.escaped then return end
	st.alive = false
	local lost = plr:GetAttribute("RoundMoney") or 0
	plr:SetAttribute("RoundMoney", 0)
	plr:SetAttribute("Role", "Spectator")
	Data.Inc(plr, "Deaths")
	Data.Inc(plr, "Broken", st.brokenCount)
	giveXP(plr, Config.XP.Death + st.brokenCount * Config.XP.DeathPerBreak)
	notify(plr, "Você morreu e perdeu $" .. lost .. " desta rodada.", "death")
	notify(nil, plr.DisplayName .. " foi pego pelo Blinder.", "kill")
end

-- ================== Personagens ==================
local function onCharacter(plr: Player, char: Model)
	local h = char:WaitForChild("Humanoid") :: Humanoid
	h.WalkSpeed = Config.WALK_SPEED
	h.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	h.Died:Connect(function() onDied(plr) end)
	task.defer(giveHammer, char)
	task.delay(0.3, updateHeadlamp, plr)
	local role = plr:GetAttribute("Role")
	if role ~= "Survivor" and role ~= "Monster" then
		if Round.phase == "Round" and role == "Lobby" then plr:SetAttribute("Role", "Spectator") end
	end
end

local function checkFlashlightPass(plr: Player)
	local id = Config.Flashlight.gamePassId
	if not id then return end
	local ok, owns = pcall(function() return MarketplaceService:UserOwnsGamePassAsync(plr.UserId, id) end)
	if ok and owns then
		plr:SetAttribute("FlashlightPass", true)
		Data.SyncAttrs(plr)
		updateHeadlamp(plr)
	end
end

Players.PlayerAdded:Connect(function(plr)
	plr:SetAttribute("InMenu", true)
	Data.Load(plr)
	task.spawn(checkFlashlightPass, plr)
	plr:SetAttribute("Role", Round.phase == "Round" and "Spectator" or "Lobby")
	plr:SetAttribute("RoundMoney", 0)
	plr:SetAttribute("Hands", Config.HAND_MAX)
	plr:SetAttribute("Bandages", 0)
	plr.CharacterAdded:Connect(function(c) onCharacter(plr, c) end)
	if plr.Character then onCharacter(plr, plr.Character) end
end)
for _, p in ipairs(Players:GetPlayers()) do task.spawn(function()
	Data.Load(p); p:SetAttribute("Role", "Lobby"); p:SetAttribute("RoundMoney", 0); p:SetAttribute("Hands", Config.HAND_MAX); p:SetAttribute("Bandages", 0)
	p.CharacterAdded:Connect(function(c) onCharacter(p, c) end)
	if p.Character then onCharacter(p, p.Character) end
end) end

Players.PlayerRemoving:Connect(function(plr)
	unhide(plr, true)
	PState[plr] = nil; pendingGame[plr] = nil
	if Round.monsterPlayer == plr then Round.monsterPlayer = nil end
end)

-- ================== Quebráveis ==================
Remotes.Hit.OnServerEvent:Connect(function(plr, model)
	if Round.phase ~= "Round" or plr:GetAttribute("Role") ~= "Survivor" or plr:GetAttribute("Hiding") then return end
	local st = PState[plr]; if not st or not st.alive then return end
	local now = os.clock()
	if lastHit[plr] and now - lastHit[plr] < Config.HAMMER_COOLDOWN * 0.8 then return end
	lastHit[plr] = now
	if typeof(model) ~= "Instance" or not model:IsA("Model") or not CS:HasTag(model, "Breakable") then return end
	if not Round.map or not model:IsDescendantOf(Round.map) then return end
	local r = rootOf(plr); if not r then return end
	local pivot = model:GetPivot().Position
	if (pivot - r.Position).Magnitude > Config.HAMMER_RANGE + 6 then return end
	if st.broken[model] then return end
	local def = Config.Breakables[model:GetAttribute("Breakable")]; if not def then return end

	local dmg = (1 + 0.25 * Data.Upgrade(plr, "Strength")) * (Data.HasSkill(plr, "S_Grip") and 1.15 or 1)
	local firstHit = st.hp[model] == nil
	local hpNow = (st.hp[model] or def.hp) - dmg
	st.hp[model] = hpNow

	-- mãos
	local hands = plr:GetAttribute("Hands") or 0
	local cost = def.handCost * (1 - 0.07 * Data.Upgrade(plr, "Resistance"))
	if firstHit and Data.HasSkill(plr, "S_Calloused") then cost = 0 end
	if hands <= 0 then
		local h = humOf(plr)
		if h then h:TakeDamage(Config.BLEED_DAMAGE) end
		Remotes.HitFx:FireClient(plr, "Bleed")
	end
	plr:SetAttribute("Hands", math.max(0, hands - cost))

	local value = math.floor(def.value * (Data.HasSkill(plr, "S_Demolisher") and 1.2 or 1))
	local broke = hpNow <= 0
	if broke then
		st.broken[model] = true
		plr:SetAttribute("RoundMoney", (plr:GetAttribute("RoundMoney") or 0) + value)
		st.brokenCount += 1
		emitNoise(pivot, Config.NOISE.Break * def.noise, plr)
	else
		emitNoise(pivot, Config.NOISE.Hit * def.noise, plr)
	end
	Remotes.BreakableUpdate:FireClient(plr, model, math.max(0, hpNow) / def.hp, broke, value)
	-- os outros ouvem o barulho (sem ver o objeto quebrar)
	for _, other in ipairs(Players:GetPlayers()) do
		if other ~= plr then Remotes.HitFx:FireClient(other, "Remote", pivot, def.sound, broke) end
	end
end)

-- ================== Ataduras ==================
Remotes.UseBandage.OnServerEvent:Connect(function(plr)
	local n = plr:GetAttribute("Bandages") or 0
	local hands = plr:GetAttribute("Hands") or 0
	if n <= 0 or hands >= Config.HAND_MAX then return end
	plr:SetAttribute("Bandages", n - 1)
	plr:SetAttribute("Hands", math.min(Config.HAND_MAX, hands + Config.BANDAGE_HEAL * (Data.HasSkill(plr, "S_Medic") and 1.5 or 1)))
	local h = humOf(plr); if h then h.Health = math.min(h.MaxHealth, h.Health + 10) end
end)

local function spawnBandages(map: Model)
	local folder = Instance.new("Folder"); folder.Name = "Bandages"; folder.Parent = map
	local points = {}
	for _, d in ipairs(map:GetDescendants()) do if d.Name == "BandageSpawn" then table.insert(points, d) end end
	for i = #points, 2, -1 do local j = math.random(i); points[i], points[j] = points[j], points[i] end
	local nBand = math.min(Config.BANDAGES_PER_MAP, math.max(0, #points - Config.Flashlight.pickupsPerMap))
	for i = 1, nBand do
		local sp = points[i]
		local b = Instance.new("Part"); b.Name = "Bandage"; b.Size = Vector3.new(0.9, 0.5, 0.9); b.Shape = Enum.PartType.Cylinder
		b.Color = Color3.fromRGB(235, 228, 210); b.Material = Enum.Material.Fabric; b.Anchored = true; b.CanCollide = false
		b.CFrame = sp.CFrame * CFrame.new(0, -0.2, 0) * CFrame.Angles(0, 0, math.rad(90))
		local stain = Instance.new("Part"); stain.Size = Vector3.new(0.92, 0.2, 0.5); stain.Color = Color3.fromRGB(120, 10, 10); stain.Material = Enum.Material.Fabric; stain.Anchored = true; stain.CanCollide = false; stain.CFrame = b.CFrame * CFrame.new(0.05, 0.2, 0); stain.Parent = b
		local l = Instance.new("PointLight"); l.Range = 5; l.Brightness = 0.6; l.Color = Color3.fromRGB(255, 240, 220); l.Parent = b
		local pp = Instance.new("ProximityPrompt"); pp.ActionText = "Pegar"; pp.ObjectText = "Atadura"; pp.HoldDuration = 0.4; pp.MaxActivationDistance = 7; pp.RequiresLineOfSight = false; pp.Style = Enum.ProximityPromptStyle.Custom; pp.Parent = b
		pp.Triggered:Connect(function(plr)
			if plr:GetAttribute("Role") ~= "Survivor" or not b.Parent then return end
			plr:SetAttribute("Bandages", (plr:GetAttribute("Bandages") or 0) + 1)
			notify(plr, "Atadura coletada  [F] para usar", "item")
			b:Destroy()
		end)
		b.Parent = folder
	end
	-- lanternas de cabeça escondidas (valem só por 1 noite)
	local src = Assets:FindFirstChild("HeadLamp")
	for i = nBand + 1, math.min(#points, nBand + Config.Flashlight.pickupsPerMap) do
		local sp = points[i]
		if src and sp then
			local lamp = src:Clone(); lamp.Name = "FlashlightPickup"; lamp.Anchored = true; lamp.CanCollide = false; lamp.CanQuery = true
			lamp.Size = src.Size * 0.9
			lamp.CFrame = sp.CFrame * CFrame.new(0, -0.15, 0) * CFrame.Angles(0, math.random() * 6, 0)
			local glow = Instance.new("PointLight"); glow.Range = 7; glow.Brightness = 1.2; glow.Color = Color3.fromRGB(255, 240, 200); glow.Parent = lamp
			local pp = Instance.new("ProximityPrompt"); pp.ActionText = "Pegar"; pp.ObjectText = "Lanterna de Cabeça"; pp.HoldDuration = 0.5; pp.MaxActivationDistance = 7
			pp.RequiresLineOfSight = false; pp.Style = Enum.ProximityPromptStyle.Custom; pp.Parent = lamp
			pp.Triggered:Connect(function(plr)
				if plr:GetAttribute("Role") ~= "Survivor" or not lamp.Parent then return end
				if hasFlashlight(plr) then notify(plr, "Você já tem uma lanterna.", "info"); return end
				plr:SetAttribute("RoundFlashlight", true)
				updateHeadlamp(plr)
				notify(plr, "Lanterna de Cabeça!  [L] para ligar", "item")
				lamp:Destroy()
			end)
			lamp.Parent = folder
		end
	end
end

Remotes.Flashlight.OnServerEvent:Connect(function(plr, on)
	if typeof(on) ~= "boolean" then return end
	if on and not hasFlashlight(plr) then return end
	plr:SetAttribute("FlashlightOn", on)
	updateHeadlamp(plr)
	local char = plr.Character
	local head = char and char:FindFirstChild("Head")
	if head then
		local s = Instance.new("Sound"); s.SoundId = Config.Sounds.Click; s.Volume = 0.5; s.PlaybackSpeed = on and 1.35 or 1.0
		s.RollOffMaxDistance = 30; s.Parent = head; s:Play()
		game:GetService("Debris"):AddItem(s, 2)
	end
end)

Remotes.BuyFlashlight.OnServerInvoke = function(plr)
	local FL = Config.Flashlight
	if plr:GetAttribute("OwnsFlashlight") then return false, "Você já tem a lanterna" end
	if FL.price then
		local ok, msg = Data.BuyFlashlight(plr)
		if ok then updateHeadlamp(plr) end
		return ok, msg
	elseif FL.gamePassId then
		MarketplaceService:PromptGamePassPurchase(plr, FL.gamePassId)
		return true, ""
	end
	return false, "A lanterna ainda não está à venda"
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(plr, passId, purchased)
	if purchased and passId == Config.Flashlight.gamePassId then
		plr:SetAttribute("FlashlightPass", true)
		Data.SyncAttrs(plr)
		updateHeadlamp(plr)
		notify(plr, "Lanterna de Cabeça é sua para sempre!", "money")
	end
end)

Remotes.MenuState.OnServerEvent:Connect(function(plr, inMenu)
	plr:SetAttribute("InMenu", inMenu == true)
end)

-- ================== Monstro jogador ==================
-- o jogador VIRA o modelo do monstro escolhido (tipo + skin)
local function morphPlayerMonster(plr: Player, spawnCF: CFrame?)
	local typeId, skinId = Data.MonsterLoadout(plr)
	local def = Config.GetMonster(typeId)
	plr:SetAttribute("MonsterType", typeId)
	plr:SetAttribute("MonWalk", def.stats.walk)
	plr:SetAttribute("MonChase", def.stats.chase)
	local rig = Factory.CreateRigged(typeId, skinId)
	if rig then
		local old = plr.Character
		rig.Name = plr.Name
		local cf = spawnCF or (old and old:GetPivot()) or CFrame.new()
		rig:PivotTo(cf + Vector3.new(0, rig.Humanoid.HipHeight + rig.PrimaryPart.Size.Y / 2, 0))
		rig:SetAttribute("Presence", Data.HasSkill(plr, "M_Presence"))
		rig:SetAttribute("Nightmare", Data.HasSkill(plr, "M_Nightmare"))
		rig.Humanoid.WalkSpeed = def.stats.walk
		plr.Character = rig
		pcall(addDrool, rig)
		rig.Parent = workspace
		pcall(function() rig.PrimaryPart:SetNetworkOwner(plr) end)
		if old and old ~= rig then old:Destroy() end
		return
	end
	-- fallback (modelo antigo de peças)
	local char = plr.Character; if not char then return end
	local r = char:FindFirstChild("HumanoidRootPart") :: BasePart
	local h = char:FindFirstChildOfClass("Humanoid") :: Humanoid
	if not r or not h then return end
	for _, d in ipairs(char:GetDescendants()) do
		if d:IsA("BasePart") and d ~= r then d.Transparency = 1 elseif d:IsA("Decal") then d.Transparency = 1 end
	end
	local vis = Instance.new("Model"); vis.Name = "MonsterVisual"; vis.Parent = char
	Factory.BuildBody(vis, r, typeId, h.HipHeight + r.Size.Y / 2)
	Factory.AddSounds(r)
	char:SetAttribute("IsMonster", true)
	h.WalkSpeed = def.stats.walk
	h.MaxHealth = math.huge; h.Health = math.huge
	if spawnCF then char:PivotTo(spawnCF) end
end

Remotes.MonsterAttack.OnServerEvent:Connect(function(plr)
	if plr ~= Round.monsterPlayer or Round.phase ~= "Round" then return end
	local now = os.clock()
	if lastAttack[plr] and now - lastAttack[plr] < 1.1 then return end
	lastAttack[plr] = now
	local r = rootOf(plr); if not r then return end
	local growl = r:FindFirstChild("Scream"); if growl then growl:Play() end
	for _, s in ipairs(survivors()) do
		local sr = rootOf(s)
		if sr and not s:GetAttribute("Hiding") then
			local off = sr.Position - r.Position
			local kr = Config.GetMonster(plr:GetAttribute("MonsterType") or "Blinder").stats.kill
			if off.Magnitude < kr + 1.5 + (Data.HasSkill(plr, "M_Claws") and 2 or 0) and r.CFrame.LookVector:Dot(off.Unit) > 0.2 then
				kill(s, plr.Character)
				break
			end
		end
	end
end)

-- ================== Habilidades do monstro-jogador ==================
local abilityCD: { [Player]: { [string]: number } } = {}
Remotes.MonsterAbility.OnServerEvent:Connect(function(plr, name)
	if plr ~= Round.monsterPlayer or Round.phase ~= "Round" then return end
	local def = Config.MonsterAbilities[name]
	if not def or not Data.HasSkill(plr, def.skill) then return end
	abilityCD[plr] = abilityCD[plr] or {}
	local now = os.clock()
	if abilityCD[plr][name] and now < abilityCD[plr][name] then return end
	abilityCD[plr][name] = now + def.cooldown - 0.3
	local r = rootOf(plr); if not r then return end
	if name == "Lunge" then
		local s = r:FindFirstChild("Scream"); if s then s.PlaybackSpeed = 1.4; s:Play(); task.delay(1.5, function() s.PlaybackSpeed = 1 end) end
		emitNoise(r.Position, 30, plr)
	elseif name == "Echo" then
		local found = {}
		for _, s in ipairs(survivors()) do
			local sr = rootOf(s)
			if sr and (sr.Position - r.Position).Magnitude < 60 then table.insert(found, s.Character) end
		end
		Remotes.MonsterVision:FireClient(plr, found, 2.5)
	elseif name == "Scream" then
		local s = r:FindFirstChild("Scream"); if s then s.PlaybackSpeed = 0.75; s.Volume = 4; s:Play(); task.delay(3, function() s.PlaybackSpeed = 1; s.Volume = 3 end) end
		for _, sv in ipairs(survivors()) do
			local sr = rootOf(sv)
			if sr and (sr.Position - r.Position).Magnitude < 35 then
				sv:SetAttribute("StunnedUntil", workspace:GetServerTimeNow() + 2)
			end
		end
	end
end)

-- ================== Habilidade ÚNICA de cada tipo de monstro [R] ==================
local specialCD: { [Player]: number } = {}
Remotes.MonsterSpecial.OnServerEvent:Connect(function(plr)
	if plr ~= Round.monsterPlayer or Round.phase ~= "Round" then return end
	local def = Config.GetMonster(plr:GetAttribute("MonsterType") or "Blinder")
	local ab = def.ability
	local now = os.clock()
	if specialCD[plr] and now < specialCD[plr] then return end
	specialCD[plr] = now + ab.cooldown - 0.3
	local r = rootOf(plr); if not r then return end
	local char = plr.Character
	local tnow = workspace:GetServerTimeNow()
	if ab.id == "Scent" then
		-- Faro: ouve todos por 6s
		task.spawn(function()
			for _ = 1, 10 do
				if Round.monsterPlayer ~= plr then break end
				local list = {}
				for _, s in ipairs(survivors()) do
					local sr = rootOf(s)
					if sr and not s:GetAttribute("Hiding") then table.insert(list, s.Character); Remotes.NoisePing:FireClient(plr, sr.Position, 18) end
				end
				Remotes.MonsterVision:FireClient(plr, list, 0.75)
				task.wait(0.6)
			end
		end)
	elseif ab.id == "Crows" then
		local hit = {}
		for _, s in ipairs(survivors()) do
			local sr = rootOf(s)
			if sr and (sr.Position - r.Position).Magnitude < 40 then
				s:SetAttribute("PanicUntil", tnow + 3)
				table.insert(hit, sr.Position)
			end
		end
		Remotes.WorldFx:FireAllClients("Crows", r.Position, hit)
	elseif ab.id == "Blackout" then
		Shared:SetAttribute("BlackoutUntil", tnow + 10)
		for _, s in ipairs(survivors()) do s:SetAttribute("FlashlightOn", false); updateHeadlamp(s) end
		Remotes.WorldFx:FireAllClients("Blackout", r.Position)
	elseif ab.id == "Silence" then
		if char then char:SetAttribute("SilentUntil", tnow + 7) end
		Remotes.WorldFx:FireAllClients("Silence", r.Position)
	elseif ab.id == "Rampage" then
		local s = r:FindFirstChild("Scream"); if s then s.PlaybackSpeed = 1.2; s.Volume = 4; s:Play() end
		task.spawn(function()
			local t0 = os.clock()
			while os.clock() - t0 < 0.9 do
				local rr = rootOf(plr)
				if not rr then break end
				for _, sv in ipairs(survivors()) do
					local sr = rootOf(sv)
					if sr and not sv:GetAttribute("Hiding") and (sr.Position - rr.Position).Magnitude < def.stats.kill + 1.5 then kill(sv, plr.Character) end
				end
				task.wait(0.08)
			end
		end)
		emitNoise(r.Position, 60, plr)
	elseif ab.id == "ShadowStep" then
		-- teleporta para trás de quem fez barulho por último
		local best, bt = nil, -math.huge
		for _, sv in ipairs(survivors()) do
			local n = lastNoise[sv]
			local sr = rootOf(sv)
			if n and sr and not sv:GetAttribute("Hiding") and n.t > bt and (sr.Position - r.Position).Magnitude < 110 then best, bt = sv, n.t end
		end
		if not best then
			specialCD[plr] = now + 2
			notify(plr, "Ninguém fez barulho por perto...", "info")
			return
		end
		local sr = rootOf(best)
		local from = r.Position
		local dest = sr.CFrame * CFrame.new(0, 0, 7)
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		local lift = hum and (hum.HipHeight + r.Size.Y / 2) or 3
		char:PivotTo(CFrame.lookAt(Vector3.new(dest.X, sr.Position.Y - (sr.Size.Y / 2 + 2) + lift, dest.Z), Vector3.new(sr.Position.X, sr.Position.Y - (sr.Size.Y / 2 + 2) + lift, sr.Position.Z)))
		Remotes.WorldFx:FireAllClients("Shadow", from, { r.Position })
		notify(best, "Algo apareceu atrás de você...", "monster")
	end
end)

-- ================== Prompts do mapa ==================
local function wireMap(map: Model)
	for _, locker in ipairs(map:GetDescendants()) do
		if locker:IsA("Model") and CS:HasTag(locker, "Locker") then
			local pp = locker:FindFirstChild("HidePrompt", true) :: ProximityPrompt
			pp.Triggered:Connect(function(plr)
				if Round.phase ~= "Round" then return end
				local role = plr:GetAttribute("Role")
				if role == "Monster" then
					openLocker(locker, plr.Character)
				elseif role == "Survivor" then
					if lockerOcc[locker] == plr then
						if not pendingGame[plr] then unhide(plr) end
					else
						hide(plr, locker)
					end
				end
			end)
		end
	end
	for _, ex in ipairs(map:GetDescendants()) do
		if ex:IsA("Model") and CS:HasTag(ex, "ExitDoor") then
			local pp = ex:FindFirstChild("ExitPrompt", true) :: ProximityPrompt
			pp.Triggered:Connect(function(plr)
				local st = PState[plr]
				if not Round.exitsOpen or plr:GetAttribute("Role") ~= "Survivor" or not st or not st.alive or st.escaped then return end
				st.escaped = true
				local earned = plr:GetAttribute("RoundMoney") or 0
				Data.AddMoney(plr, earned)
				Data.Inc(plr, "Escapes")
				Data.Inc(plr, "Broken", st.brokenCount)
				giveXP(plr, Config.XP.Escape + st.brokenCount * Config.XP.PerBreak)
				plr:SetAttribute("Role", "Escaped")
				plr:SetAttribute("RoundMoney", 0)
				teleportToLobby(plr)
				notify(plr, "VOCÊ FUGIU!  +$" .. earned, "escape")
				notify(nil, plr.DisplayName .. " escapou da mansão.", "info")
			end)
		end
	end
end

Remotes.LockerExit.OnServerEvent:Connect(function(plr)
	if pendingGame[plr] then return end -- não pode sair no meio do minigame
	unhide(plr)
end)

Remotes.BuyUpgrade.OnServerInvoke = function(plr, id)
	if typeof(id) ~= "string" then return false, "inválido" end
	return Data.BuyUpgrade(plr, id)
end
Remotes.UnlockSkill.OnServerInvoke = function(plr, id)
	if typeof(id) ~= "string" then return false, "inválido" end
	return Data.UnlockSkill(plr, id)
end
Remotes.ResetSkills.OnServerInvoke = function(plr, tree)
	if typeof(tree) ~= "string" then return false, "inválido" end
	return Data.ResetSkills(plr, tree)
end
Remotes.BuySkin.OnServerInvoke = function(plr, id)
	if typeof(id) ~= "string" then return false, "inválido" end
	return Data.BuySkin(plr, id)
end
Remotes.BuyMonster.OnServerInvoke = function(plr, id)
	if typeof(id) ~= "string" then return false, "inválido" end
	return Data.BuyMonster(plr, id)
end
Remotes.BuyMonsterSkin.OnServerInvoke = function(plr, monsterId, skinId)
	if typeof(monsterId) ~= "string" or typeof(skinId) ~= "string" then return false, "inválido" end
	return Data.BuyMonsterSkin(plr, monsterId, skinId)
end
Remotes.BuyHammer.OnServerInvoke = function(plr, id)
	if typeof(id) ~= "string" then return false, "inválido" end
	return Data.BuyHammer(plr, id)
end
Remotes.BuyEmote.OnServerInvoke = function(plr, id)
	if typeof(id) ~= "string" then return false, "inválido" end
	return Data.BuyEmote(plr, id)
end

Remotes.GetData.OnServerInvoke = function(plr)
	local d = Data.Get(plr)
	return d and { Money = d.Money, Upgrades = d.Upgrades, Escapes = d.Escapes, Kills = d.Kills, Deaths = d.Deaths, Broken = d.Broken } or nil
end

-- ================== Lobby: parkour ==================
local checkpoints: { [Player]: CFrame } = {}
local finishCD: { [Player]: number } = {}
for _, p in ipairs(lobby.Parkour:GetChildren()) do
	if p:GetAttribute("Checkpoint") or p:GetAttribute("Finish") then
		p.Touched:Connect(function(hit)
			local plr = Players:GetPlayerFromCharacter(hit.Parent); if not plr then return end
			checkpoints[plr] = p.CFrame * CFrame.new(0, 3.5, 0)
			if p:GetAttribute("Finish") and (not finishCD[plr] or os.clock() > finishCD[plr]) then
				finishCD[plr] = os.clock() + 90
				Data.AddMoney(plr, 25)
				giveXP(plr, Config.XP.Parkour)
				notify(plr, "Parkour completo!  +$25", "money")
			end
		end)
	end
end
task.spawn(function()
	while true do
		task.wait(0.5)
		for _, plr in ipairs(Players:GetPlayers()) do
			local role = plr:GetAttribute("Role")
			local r = rootOf(plr)
			if r and role ~= "Survivor" and role ~= "Monster" and r.Position.Y < 590 and r.Position.Y > 300 then
				plr.Character:PivotTo(checkpoints[plr] or (lobbySpawn.CFrame * CFrame.new(0, 3.5, 0)))
			end
		end
	end
end)

-- ================== Ranking TOP GLOBAL no lobby (OrderedDataStore) ==================
local DSS = game:GetService("DataStoreService")
local ordered = {}
for _, st in ipairs({ "Money", "Escapes", "Kills", "Level" }) do
	pcall(function() ordered[st] = DSS:GetOrderedDataStore("BlinderTop_" .. st) end)
end
local nameCache = {}
local function nameOf(userId: number): string
	if nameCache[userId] then return nameCache[userId] end
	local ok, n = pcall(function() return Players:GetNameFromUserIdAsync(userId) end)
	nameCache[userId] = ok and n or ("#" .. userId)
	return nameCache[userId]
end
local function fmtNum(n: number): string
	local s = tostring(math.floor(n))
	local out = s:reverse():gsub("(%d%d%d)", "%1."):reverse()
	return (out:gsub("^%.", ""))
end
local function pushScores()
	for _, plr in ipairs(Players:GetPlayers()) do
		local d = Data.Get(plr)
		if d then
			for st, store in pairs(ordered) do
				local v = math.floor(tonumber(d[st]) or 0)
				pcall(function() store:SetAsync(tostring(plr.UserId), v) end)
			end
		end
	end
end
local function refreshBoards()
	for _, b in ipairs(globalBoards) do
		local rows = {}
		local store = ordered[b.stat]
		local ok = false
		if store then
			ok = pcall(function()
				local pages = store:GetSortedAsync(false, 10)
				for _, e in ipairs(pages:GetCurrentPage()) do
					table.insert(rows, { name = nameOf(tonumber(e.key) or 0), v = e.value })
				end
			end)
		end
		if not ok or #rows == 0 then
			-- sem DataStore (Studio sem acesso à API): mostra quem está no servidor
			rows = {}
			for _, p in ipairs(Players:GetPlayers()) do
				local d = Data.Get(p)
				table.insert(rows, { name = p.DisplayName, v = d and (tonumber(d[b.stat]) or 0) or (p:GetAttribute(b.stat) or 0) })
			end
			table.sort(rows, function(x, y) return x.v > y.v end)
		end
		local medal = { "👑 ", "🥈 ", "🥉 " }
		for i, row in ipairs(b.rows) do
			local e = rows[i]
			row.Text = e and string.format("%s%d.  %s   —   " .. b.fmt, medal[i] or "", i, e.name, fmtNum(e.v)) or (i .. ".  ...")
		end
	end
end
task.spawn(function()
	task.wait(5)
	while true do
		pcall(pushScores)
		pcall(refreshBoards)
		task.wait(60)
	end
end)

-- ================== Gotas de sangue de quem está com as mãos destruídas ==================
task.spawn(function()
	while true do
		task.wait(1.1)
		if Round.phase == "Round" then
			for _, plr in ipairs(survivors()) do
				if (plr:GetAttribute("Hands") or 100) <= 0 and not plr:GetAttribute("Hiding") then
					local r = rootOf(plr)
					if r then bloodSplatAt(r.Position + r.CFrame.RightVector * 1.1, 0.16) end
				end
			end
		end
	end
end)

-- ================== Sensores de ruído (passos) ==================
task.spawn(function()
	while true do
		task.wait(0.3)
		if Round.phase == "Round" then
			for _, plr in ipairs(survivors()) do
				local r = rootOf(plr)
				if r and not plr:GetAttribute("Hiding") then
					local v = r.AssemblyLinearVelocity
					local flat = Vector3.new(v.X, 0, v.Z).Magnitude
					if flat > Config.WALK_SPEED + 2.5 then emitNoise(r.Position, Config.NOISE.Sprint * (Data.HasSkill(plr, "S_SilentRun") and 0.75 or 1), plr)
					elseif flat > 2 then emitNoise(r.Position, Config.NOISE.Walk * (Data.HasSkill(plr, "S_Quiet") and 0.65 or 1), plr) end
					if math.abs(v.Y) > 12 then emitNoise(r.Position, Config.NOISE.Jump, plr) end
				end
			end
			-- monstro passando perto de armário ocupado => minigame
			local mpos
			if Round.monsterAI then mpos = Round.monsterAI.root.Position
			elseif Round.monsterPlayer then local r = rootOf(Round.monsterPlayer); mpos = r and r.Position end
			if mpos then
				for locker, plr in pairs(lockerOcc) do
					local d = (locker:GetPivot().Position - mpos).Magnitude
					if d < Config.MONSTER_LOCKER_CHECK_RANGE and not pendingGame[plr] and (not lockerGameCD[plr] or os.clock() > lockerGameCD[plr]) then
						task.spawn(function()
							local ai = Round.monsterAI
							if ai then ai:Listen(locker:GetPivot().Position, 12) end
							local ok = runMinigame(plr, d < 10 and "Hard" or "Normal")
							if ai and Round.monsterAI == ai then
								ai:Release()
								if not ok and lockerOcc[locker] == plr then
									ai:SuspectLocker(locker, true)
								end
							end
						end)
					end
				end
			end
		end
	end
end)

-- ================== Ciclo de rodadas ==================
local function setPhase(p: string) Round.phase = p; setG("Phase", p) end

local function startRound(): boolean
	-- quem ainda está na tela inicial não entra na rodada
	local players = {}
	for _, p in ipairs(Players:GetPlayers()) do if not p:GetAttribute("InMenu") then table.insert(players, p) end end
	if #players < Config.MIN_PLAYERS then return false end
	local maps = mapStore:GetChildren()
	-- evita repetir o mesmo mapa duas vezes seguidas
	local template = (Round.forceMap and mapStore:FindFirstChild(Round.forceMap)) or maps[math.random(#maps)]
	if not Round.forceMap and #maps > 1 then
		local tries = 0
		while template.Name == Round.lastMap and tries < 10 do template = maps[math.random(#maps)]; tries += 1 end
	end
	Round.forceMap = nil
	Round.lastMap = template.Name
	local map = template:Clone()
	map.Name = "ActiveMap"
	map.Parent = workspace
	Round.map = map
	Round.exitsOpen = false
	Round.devOpenExits = false
	setG("ExitsOpen", false)
	setG("MapName", template:GetAttribute("MapName") or template.Name)
	wireMap(map)
	spawnBandages(map)
	Round.nav = Nav.build(map)

	-- escolhe o monstro
	Round.monsterPlayer = nil
	if Round.forceMonster and Round.forceMonster.Parent then
		Round.monsterPlayer = Round.forceMonster
		Round.forceMonster = nil
	elseif #players >= Config.PLAYER_MONSTER_MIN_PLAYERS and math.random() < Config.PLAYER_MONSTER_CHANCE then
		Round.monsterPlayer = players[math.random(#players)]
	end
	setG("MonsterMode", Round.monsterPlayer and "Player" or "AI")
	setG("MonsterName", Round.monsterPlayer and Round.monsterPlayer.DisplayName or "O Blinder")

	local spawns = {}
	for _, d in ipairs(map.Spawns:GetChildren()) do if d.Name == "PlayerSpawn" then table.insert(spawns, d) end end
	local mSpawn = map.Spawns.MonsterSpawn

	for i, plr in ipairs(players) do
		PState[plr] = { alive = true, escaped = false, broken = {}, hp = {}, brokenCount = 0 }
		plr:SetAttribute("RoundMoney", 0)
		plr:SetAttribute("Hands", Config.HAND_MAX)
		plr:SetAttribute("Bandages", Data.HasSkill(plr, "S_Medic") and 1 or 0)
		plr:SetAttribute("Hiding", nil)
		plr:SetAttribute("StunnedUntil", 0)
		plr:SetAttribute("RoundFlashlight", false)
		plr:SetAttribute("FlashlightOn", false)
		if not plr.Character or not humOf(plr) or humOf(plr).Health <= 0 then
			plr:LoadCharacter()
		end
		local char = plr.Character
		if plr == Round.monsterPlayer then
			PState[plr].alive = false
			plr:SetAttribute("Role", "Monster")
			char:PivotTo(lobbySpawn.CFrame * CFrame.new(0, 3.5, 12))
		else
			plr:SetAttribute("Role", "Survivor")
			local sp = spawns[((i - 1) % #spawns) + 1]
			char:PivotTo(sp.CFrame * CFrame.new(0, 3, 0))
			local h = humOf(plr); if h then h.Health = h.MaxHealth; h.WalkSpeed = Config.WALK_SPEED end
		end
	end

	Round.startSurvivors = 0
	for _, plr in ipairs(players) do if plr:GetAttribute("Role") == "Survivor" then Round.startSurvivors += 1 end end

	-- o monstro acorda depois de alguns segundos
	task.delay(8, function()
		if Round.map ~= map or Round.phase ~= "Round" then return end
		if Round.monsterPlayer and Round.monsterPlayer.Parent then
			local mp = Round.monsterPlayer
			morphPlayerMonster(mp, CFrame.new(mSpawn.Position - Vector3.new(0, mSpawn.Position.Y, 0)) * mSpawn.CFrame.Rotation)
			notify(mp, "VOCÊ É O BLINDER. Você é cego: siga os sons. [Clique] atacar  [E] abrir armário", "monster")
		else
			local model = Factory.CreateAI(nil, "Original")
			pcall(addDrool, model)
			model:PivotTo(mSpawn.CFrame)
			model.Parent = workspace
			CS:AddTag(model, "Monster")
			local ai = MonsterAI.new(model, {
				map = map,
				nav = Round.nav,
				getSurvivors = survivors,
				charactersFolder = function()
					local t = {}
					for _, p in ipairs(Players:GetPlayers()) do if p.Character then table.insert(t, p.Character) end end
					return table.unpack(t)
				end,
				kill = kill,
				lockerOf = lockerOf,
				nearestOccupiedLocker = nearestOccupiedLocker,
				checkLocker = checkLocker,
				openLocker = openLocker,
			})
			Round.monsterAI = ai
			ai:Start()
		end
		notify(nil, "O BLINDER ACORDOU", "monster")
	end)
	return true
end

local function endRound()
	setPhase("Ending")
	for plr, st in pairs(PState) do
		if plr.Parent and st.alive and not st.escaped and plr:GetAttribute("Role") == "Survivor" then
			local lost = plr:GetAttribute("RoundMoney") or 0
			notify(plr, "Você não fugiu a tempo. Perdeu $" .. lost .. ".", "death")
		end
	end
	for _, plr in ipairs(Players:GetPlayers()) do unhide(plr, true) end
	table.clear(lockerOcc)
	task.wait(3)
	if Round.monsterAI then Round.monsterAI:Destroy(); Round.monsterAI = nil end
	for plr in pairs(PState) do if plr.Parent then Data.Inc(plr, "Rounds") end end
	if Round.monsterPlayer and Round.monsterPlayer.Parent then giveXP(Round.monsterPlayer, Config.XP.MonsterRound) end
	local mp = Round.monsterPlayer
	Round.monsterPlayer = nil
	for _, plr in ipairs(Players:GetPlayers()) do
		plr:SetAttribute("Role", "Lobby")
		plr:SetAttribute("RoundMoney", 0)
		plr:SetAttribute("Hiding", nil)
		plr:SetAttribute("RoundFlashlight", false)
		plr:SetAttribute("FlashlightOn", false)
		task.defer(updateHeadlamp, plr)
		if plr == mp then
			plr:LoadCharacter()
		else
			local h = humOf(plr)
			if h and h.Health > 0 then teleportToLobby(plr) end
		end
	end
	table.clear(PState)
	if Round.map then Round.map:Destroy(); Round.map = nil end
end

task.spawn(function()
	setPhase("Intermission")
	while true do
		-- INTERVALO (lobby)
		setPhase("Intermission")
		local full = game:GetService("RunService"):IsStudio() and Config.STUDIO_INTERMISSION or Config.INTERMISSION
		local t = full
		while t > 0 do
			setG("TimeLeft", t)
			task.wait(1)
			local ready = 0
			for _, p in ipairs(Players:GetPlayers()) do if not p:GetAttribute("InMenu") then ready += 1 end end
			if ready >= Config.MIN_PLAYERS then t -= 1 else t = full end
		end
		setPhase("Round")
		if startRound() then
			local tl = Config.ROUND_TIME
			while tl > 0 do
				setG("TimeLeft", tl)
				if not Round.exitsOpen and (Config.ROUND_TIME - tl >= Config.EXIT_UNLOCK_TIME or Round.devOpenExits) then
					Round.exitsOpen = true
					setG("ExitsOpen", true)
					for _, d in ipairs(Round.map:GetDescendants()) do
						if d:IsA("ProximityPrompt") and d.Name == "ExitPrompt" then d.Enabled = true end
					end
					notify(nil, "AS SAÍDAS ESTÃO ABERTAS", "exits")
				end
				task.wait(1)
				tl -= 1
				if (Round.startSurvivors or 0) > 0 and #survivors() == 0 and tl < Config.ROUND_TIME - 10 then break end
			end
			endRound()
		end
	end
end)

-- ================== Comandos de teste (só no Studio) ==================
if game:GetService("RunService"):IsStudio() then
	local dev = SS.Blinder:FindFirstChild("Dev") or Instance.new("BindableFunction")
	dev.Name = "Dev"; dev.Parent = SS.Blinder
	dev.OnInvoke = function(cmd, plr, amount)
		plr = plr or Players:GetPlayers()[1]
		if cmd == "money" then Data.AddMoney(plr, amount or 10000)
		elseif cmd == "xp" then giveXP(plr, amount or 500)
		elseif cmd == "map" then
			Round.forceMap = amount
		elseif cmd == "exits" then
			Round.devOpenExits = true
		elseif cmd == "monster" then
			-- força o jogador a ser o monstro na próxima rodada
			Round.forceMonster = plr
		end
		return true
	end
	-- no chat: /dinheiro  /xp  /monstro
	Players.PlayerAdded:Connect(function(plr)
		plr.Chatted:Connect(function(msg)
			if msg == "/dinheiro" then Data.AddMoney(plr, 10000)
			elseif msg == "/xp" then giveXP(plr, 500)
			elseif msg == "/monstro" then Round.forceMonster = plr; notify(plr, "Você será o monstro na próxima noite.", "monster")
			elseif msg == "/pizzaria" then Round.forceMap = "Pizzeria"; notify(plr, "Próxima noite: Pizzaria.", "info")
			elseif msg == "/mansao" then Round.forceMap = "Mansion"; notify(plr, "Próxima noite: Mansão.", "info") end
		end)
	end)
end

print("[BLINDER] servidor iniciado")
