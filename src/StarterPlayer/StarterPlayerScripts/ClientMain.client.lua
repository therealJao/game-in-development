-- BLINDER :: cliente principal
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local TS = game:GetService("TweenService")
local CS = game:GetService("CollectionService")
local Lighting = game:GetService("Lighting")
local SoundService = game:GetService("SoundService")
local PPS = game:GetService("ProximityPromptService")
local Debris = game:GetService("Debris")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local Shared = RS:WaitForChild("Blinder")
local Config = require(Shared:WaitForChild("Config"))
local Remotes = Shared:WaitForChild("Remotes")
local VMmod = require(Shared:WaitForChild("Viewmodel"))
local K = require(script.Parent:WaitForChild("UIKit"))
local Settings = require(script.Parent:WaitForChild("Settings"))
local Hud = require(script.Parent:WaitForChild("Hud"))
local Menu = require(script.Parent:WaitForChild("Menu"))
local Minigame = require(script.Parent:WaitForChild("Minigame"))
local Animator = require(script.Parent:WaitForChild("MonsterAnimator"))
local LobbyFx = require(script.Parent:WaitForChild("LobbyFx"))
local Title = require(script.Parent:WaitForChild("TitleScreen"))
local C, FF = K.C, K.Font
local rad = math.rad

local hud = Hud.init(player)
Menu.init(player, hud)
Animator.init()
LobbyFx.init()

-- ===================== estado =====================
local char: Model?, hum: Humanoid?, root: BasePart?
local inTitle = true
local stamina = Config.STAMINA_MAX
local lastSprint = 0
local sprinting = false
local exhausted = false
local shake = 0
local fear = 0
local chased, wasChased = false, false
local brokenLocal: { [Model]: boolean } = {}
local hpLocal: { [Model]: number } = {}
local spectating = false
local specIndex = 1
local adrenalineUntil, adrenalineCD = 0, 0
local lungeUntil = 0
local abilityCD = { Lunge = 0, Echo = 0, Scream = 0 }
local specialCD, rampageUntil = 0, 0
local function serverNow() return workspace:GetServerTimeNow() end
local function myMonsterDef() return Config.GetMonster(player:GetAttribute("MonsterType") or "Blinder") end
local function blackoutActive() return (Shared:GetAttribute("BlackoutUntil") or 0) > serverNow() end
local emoteTrack: AnimationTrack? = nil
local slashTrack: AnimationTrack? = nil
local lobbyUIShown = nil
local hudMode = nil
local hintUntil = 0
local battery, flashOn, lastFlashOff = 1, false, 0

local function role(): string return player:GetAttribute("Role") or "Lobby" end
local function isSurvivor() return role() == "Survivor" end
local function isMonster() return role() == "Monster" end
local function hiding() return player:GetAttribute("Hiding") ~= nil end
local function hasSkill(id: string) return player:GetAttribute("Sk_" .. id) == true end
local function stunned() return (player:GetAttribute("StunnedUntil") or 0) > workspace:GetServerTimeNow() end

local function maxStamina()
	if isMonster() then return 160 end
	return Config.STAMINA_MAX + 12 * (player:GetAttribute("Up_Stamina") or 0) + (hasSkill("S_Lungs") and 20 or 0)
end

-- ===================== sons =====================
local function sound(id: string, vol: number?, pitch: number?, parent: Instance?): Sound
	local s = Instance.new("Sound")
	s.SoundId = id; s.Volume = (vol or 1) * Settings.sfx; s.PlaybackSpeed = pitch or 1
	s.Parent = parent or SoundService
	return s
end
local function playAt(id: string, pos: Vector3, vol: number?, pitch: number?)
	local a = Instance.new("Part"); a.Anchored = true; a.CanCollide = false; a.CanQuery = false; a.Transparency = 1; a.Size = Vector3.one; a.Position = pos; a.Parent = workspace
	local s = sound(id, vol, pitch, a); s.RollOffMaxDistance = 140; s.RollOffMinDistance = 6; s:Play()
	Debris:AddItem(a, 5)
end
local function play2D(id: string, vol: number?, pitch: number?)
	local s = sound(id, vol, pitch); s:Play(); Debris:AddItem(s, 8)
	return s
end

local ambience = Instance.new("Sound"); ambience.SoundId = Config.Sounds.Ambience; ambience.Looped = true; ambience.Volume = 0; ambience.Parent = SoundService; ambience:Play()
local heartbeat = Instance.new("Sound"); heartbeat.SoundId = Config.Sounds.Heartbeat; heartbeat.Looped = true; heartbeat.Volume = 0; heartbeat.Parent = SoundService; heartbeat:Play()
local chaseMusic = Instance.new("Sound"); chaseMusic.SoundId = Config.Sounds.Chase; chaseMusic.Looped = true; chaseMusic.Volume = 0; chaseMusic.Parent = SoundService; chaseMusic:Play()

local fearCC = Instance.new("ColorCorrectionEffect"); fearCC.Name = "FearCC"; fearCC.Parent = Lighting
local fearBlur = Instance.new("BlurEffect"); fearBlur.Name = "FearBlur"; fearBlur.Size = 0; fearBlur.Parent = Lighting

-- luz da lanterna presa na câmera (para o próprio jogador, acompanha o olhar)
local camLightPart = Instance.new("Part"); camLightPart.Name = "FlashlightLocal"; camLightPart.Anchored = true; camLightPart.CanCollide = false; camLightPart.CanQuery = false; camLightPart.CanTouch = false
camLightPart.Transparency = 1; camLightPart.Size = Vector3.new(0.1, 0.1, 0.1); camLightPart.CastShadow = false; camLightPart.Parent = camera
local camLight = Instance.new("SpotLight"); camLight.Face = Enum.NormalId.Front; camLight.Angle = 50; camLight.Range = 55; camLight.Brightness = 3.2
camLight.Color = Color3.fromRGB(255, 244, 222); camLight.Shadows = true; camLight.Enabled = false; camLight.Parent = camLightPart
local camFill = Instance.new("PointLight"); camFill.Range = 9; camFill.Brightness = 0.6; camFill.Color = Color3.fromRGB(255, 240, 220); camFill.Shadows = false; camFill.Enabled = false; camFill.Parent = camLightPart
-- "olho acostumado ao escuro": luz fraquíssima em volta de quem está vivo no mapa (sem ela o breu é total)
local nightEyePart = Instance.new("Part"); nightEyePart.Name = "NightEyeLocal"; nightEyePart.Anchored = true; nightEyePart.CanCollide = false; nightEyePart.CanQuery = false; nightEyePart.CanTouch = false; nightEyePart.Transparency = 1; nightEyePart.Size = Vector3.one
local nightEye = Instance.new("PointLight"); nightEye.Range = 11; nightEye.Brightness = 0.32; nightEye.Color = Color3.fromRGB(150, 160, 200); nightEye.Shadows = false; nightEye.Parent = nightEyePart
-- sustos aleatórios: sons distantes enquanto a noite corre
local scareT = 20

-- ===================== emotes =====================
local function stopEmote()
	if emoteTrack then emoteTrack:Stop(0.2); emoteTrack = nil end
	if player.CameraMode ~= Enum.CameraMode.LockFirstPerson and not inTitle then
		player.CameraMinZoomDistance = 0.5
		player.CameraMaxZoomDistance = 0.5
		player.CameraMode = Enum.CameraMode.LockFirstPerson
	end
end

local function playEmote(id: string)
	if isSurvivor() or isMonster() then hud.notify("Emotes só no lobby.", "info"); return end
	local e = Config.GetEmote(id)
	if not e or not hum or hum.Health <= 0 or not player:GetAttribute("Emote_" .. id) then return end
	local animator = hum:FindFirstChildOfClass("Animator")
	if not animator then return end
	if emoteTrack then emoteTrack:Stop(0.1); emoteTrack = nil end
	local anim = Instance.new("Animation"); anim.AnimationId = e.anim
	local ok, track = pcall(function() return animator:LoadAnimation(anim) end)
	if not ok or not track then hud.notify("Não foi possível tocar o emote.", "death"); return end
	emoteTrack = track
	track.Priority = Enum.AnimationPriority.Action
	track.Looped = id:sub(1, 5) == "Dance"
	track:Play(0.2)
	player.CameraMode = Enum.CameraMode.Classic
	player.CameraMaxZoomDistance = 12
	player.CameraMinZoomDistance = 9
	track.Stopped:Connect(function() if emoteTrack == track then stopEmote() end end)
end
Menu.playEmote = playEmote

-- ===================== personagem =====================
local function onCharacter(c: Model)
	char = c
	hum = c:WaitForChild("Humanoid") :: Humanoid
	root = c:WaitForChild("HumanoidRootPart") :: BasePart
	emoteTrack = nil
	slashTrack = nil
	stopEmote()
	stamina = maxStamina()
	if not inTitle then hum.WalkSpeed = Config.WALK_SPEED end
	hum.CameraOffset = Vector3.zero
	if spectating then spectating = false; hud.spectate.Visible = false end
	if not inTitle then camera.CameraSubject = hum end
	task.spawn(function()
		local animator = hum:WaitForChild("Animator", 5)
		if animator and hum.RigType == Enum.HumanoidRigType.R15 then
			local a = Instance.new("Animation"); a.AnimationId = "rbxassetid://522635514" -- toolslash (padrão do Roblox)
			local ok, t = pcall(function() return animator:LoadAnimation(a) end)
			if ok then slashTrack = t; t.Priority = Enum.AnimationPriority.Action end
		end
	end)
	task.delay(2, function()
		if hud.death.Visible then
			K.tween(hud.death, 1, { BackgroundTransparency = 1 })
			K.tween(hud.deathTitle, 1, { TextTransparency = 1 })
			K.tween(hud.deathSub, 1, { TextTransparency = 1 })
			task.wait(1); hud.death.Visible = false
		end
	end)
end
player.CharacterAdded:Connect(onCharacter)
if player.Character then task.spawn(onCharacter, player.Character) end

-- ===================== mãos + martelo (viewmodel) =====================
local rig = VMmod.build(camera)
VMmod.setHammer(rig, player:GetAttribute("HammerSkin"))
player:GetAttributeChangedSignal("HammerSkin"):Connect(function() VMmod.setHammer(rig, player:GetAttribute("HammerSkin")) end)
local vmModel = rig.model
local swingT = -1
local SWING_DUR = 0.62
local swingHitDone = false
local bandageT = -1
local equipT = 1
local kick = 0
local sprintBlend = 0
local bobT = 0
local lastCamCF = camera.CFrame
local sway = Vector2.zero

local BASE = CFrame.new(1.0, -0.92, -2.55) * CFrame.Angles(rad(-30), rad(-18), rad(14))
-- golpe de cima (alternado com golpe lateral)
local WIND = CFrame.new(0.2, 0.75, 0.55) * CFrame.Angles(rad(72), rad(10), rad(-18))
local STRIKE = CFrame.new(-0.28, -0.5, -0.75) * CFrame.Angles(rad(-80), rad(-6), rad(24))
local WIND_SIDE = CFrame.new(0.75, 0.25, 0.4) * CFrame.Angles(rad(20), rad(-70), rad(-50))
local STRIKE_SIDE = CFrame.new(-0.9, -0.15, -0.55) * CFrame.Angles(rad(-25), rad(55), rad(60))
local swingSide = false
local hitstop = 0
local SPRINT = CFrame.new(0.28, -0.42, 0.4) * CFrame.Angles(rad(-38), rad(38), rad(-18))
local function easeOut(k) return 1 - (1 - k) ^ 3 end
local function easeIn(k) return k * k * k end

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

local function findBreakable(inst: Instance?): Model?
	while inst and inst ~= workspace do
		if inst:IsA("Model") and inst:GetAttribute("Breakable") then return inst end
		inst = inst.Parent
	end
	return nil
end

local function aimRay(range: number)
	local ignore = { vmModel, camLightPart }
	if char then table.insert(ignore, char) end
	rayParams.FilterDescendantsInstances = ignore
	return workspace:Raycast(camera.CFrame.Position, camera.CFrame.LookVector * range, rayParams)
end

-- ===================== FX de quebra =====================
local lastHitPos: Vector3? = nil
local function hideModelLocal(m: Model)
	for _, d in ipairs(m:GetDescendants()) do
		if d:IsA("BasePart") then d.Transparency = 1; d.CanCollide = false; d.CanQuery = false; d.CastShadow = false
		elseif d:IsA("Light") then d.Enabled = false
		elseif d:IsA("SurfaceGui") or d:IsA("Decal") then (d :: any).Enabled = false end
	end
end

local function debrisBurst(m: Model, kind: string)
	local parts = {}
	for _, d in ipairs(m:GetDescendants()) do if d:IsA("BasePart") and d.Transparency < 1 then table.insert(parts, d) end end
	local center = m:GetPivot().Position
	local from = lastHitPos or center
	-- 1) o próprio objeto se desmonta: cada peça vira física e voa a partir do ponto do golpe
	for i, p in ipairs(parts) do
		if i > 40 then break end
		local c = p:Clone()
		for _, ch in ipairs(c:GetChildren()) do if not ch:IsA("DataModelMesh") and not ch:IsA("Decal") then ch:Destroy() end end
		c.Anchored = false; c.CanCollide = p.Size.Magnitude > 0.6; c.CanQuery = false; c.CanTouch = false
		c.Parent = workspace
		local dir = (c.Position - from); dir = (dir.Magnitude > 0.05 and dir.Unit or Vector3.yAxis)
		local power = (kind == "Glass") and 26 or (kind == "Metal" and 14 or 20)
		c.AssemblyLinearVelocity = dir * (power * (0.5 + math.random() * 0.7)) + Vector3.new(0, 8 + math.random() * 10, 0)
		c.AssemblyAngularVelocity = Vector3.new(math.random(-14, 14), math.random(-14, 14), math.random(-14, 14))
		task.delay(4 + math.random() * 2.5, function()
			if c.Parent then TS:Create(c, TweenInfo.new(1.2), { Transparency = 1 }):Play(); Debris:AddItem(c, 1.3) end
		end)
	end
	-- 2) estilhaços pequenos: vidro = cacos transparentes, madeira = farpas compridas, metal = parafusos
	local total = 0
	for _, p in ipairs(parts) do
		local n = math.clamp(math.floor(p.Size.Magnitude * 1.2), 1, 5)
		for _ = 1, n do
			if total > 50 then break end
			total += 1
			local s = math.clamp(p.Size.Magnitude / 7, 0.12, 0.55) * (0.5 + math.random())
			local c = Instance.new("Part")
			if kind == "Wood" then c.Size = Vector3.new(s * 0.25, s * 0.25, s * 2.2)
			elseif kind == "Glass" then c.Size = Vector3.new(s, 0.05, s * (0.6 + math.random()))
			else c.Size = Vector3.new(s * 0.5, s * 0.5, s * 0.5) end
			c.Color = (kind == "Glass") and Color3.fromRGB(200, 225, 240) or p.Color
			c.Material = (kind == "Glass") and Enum.Material.Glass or p.Material
			c.Transparency = (kind == "Glass") and 0.35 or 0
			c.Reflectance = (kind == "Glass") and 0.3 or 0
			c.CFrame = p.CFrame * CFrame.new((math.random() - 0.5) * p.Size.X, (math.random() - 0.5) * p.Size.Y, (math.random() - 0.5) * p.Size.Z) * CFrame.Angles(math.random() * 6, math.random() * 6, math.random() * 6)
			c.CanQuery = false; c.CanTouch = false
			c.Parent = workspace
			local dir = (c.Position - from); dir = (dir.Magnitude > 0.01 and dir.Unit or Vector3.yAxis)
			c.AssemblyLinearVelocity = dir * (14 + math.random() * 20) + Vector3.new(0, 10 + math.random() * 14, 0)
			c.AssemblyAngularVelocity = Vector3.new(math.random(-25, 25), math.random(-25, 25), math.random(-25, 25))
			task.delay(3 + math.random() * 2, function()
				if c.Parent then TS:Create(c, TweenInfo.new(0.8), { Transparency = 1 }):Play(); Debris:AddItem(c, 0.9) end
			end)
		end
	end
	-- 3) poeira, faíscas e um clarão rápido
	local a = Instance.new("Part"); a.Anchored = true; a.CanCollide = false; a.CanQuery = false; a.Transparency = 1; a.Size = Vector3.one; a.Position = center + Vector3.new(0, 1.5, 0); a.Parent = workspace
	local pe = Instance.new("ParticleEmitter")
	pe.Texture = "rbxasset://textures/particles/smoke_main.dds"
	pe.Color = ColorSequence.new(Color3.fromRGB(120, 112, 104)); pe.Size = NumberSequence.new(2, 7); pe.Transparency = NumberSequence.new(0.5, 1)
	pe.Lifetime = NumberRange.new(1.2, 2.6); pe.Speed = NumberRange.new(3, 9); pe.SpreadAngle = Vector2.new(180, 180); pe.Rate = 0; pe.Drag = 2; pe.Parent = a
	pe:Emit(26)
	if kind == "Metal" or kind == "Glass" then
		local sp = pe:Clone(); sp.Texture = "rbxasset://textures/particles/sparkles_main.dds"; sp.Color = ColorSequence.new(kind == "Metal" and Color3.fromRGB(255, 190, 90) or Color3.fromRGB(220, 240, 255)); sp.Size = NumberSequence.new(0.35, 0); sp.Transparency = NumberSequence.new(0, 1); sp.Lifetime = NumberRange.new(0.3, 0.8); sp.Speed = NumberRange.new(18, 36); sp.LightEmission = 1; sp.Drag = 0; sp.Acceleration = Vector3.new(0, -40, 0); sp.Parent = a
		sp:Emit(45)
	end
	local fl = Instance.new("PointLight"); fl.Range = 14; fl.Brightness = 3; fl.Color = (kind == "Metal") and Color3.fromRGB(255, 180, 90) or Color3.fromRGB(255, 230, 210); fl.Parent = a
	TS:Create(fl, TweenInfo.new(0.25), { Brightness = 0 }):Play()
	Debris:AddItem(a, 3)
	lastHitPos = nil
end

local function wobble(m: Model, frac: number)
	for _, d in ipairs(m:GetDescendants()) do
		if d:IsA("BasePart") then
			if d:GetAttribute("OrigColor") == nil then d:SetAttribute("OrigColor", d.Color) end
			d.Color = (d:GetAttribute("OrigColor") :: Color3):Lerp(Color3.new(0.08, 0.06, 0.05), (1 - frac) * 0.55)
			local o = d.CFrame
			d.CFrame = o * CFrame.new((math.random() - 0.5) * 0.3, 0.05, (math.random() - 0.5) * 0.3) * CFrame.Angles((math.random() - 0.5) * 0.08, (math.random() - 0.5) * 0.1, (math.random() - 0.5) * 0.08)
			task.delay(0.05, function() if d.Parent then d.CFrame = o * CFrame.new((math.random() - 0.5) * 0.1, 0, (math.random() - 0.5) * 0.1) end end)
			task.delay(0.11, function() if d.Parent then d.CFrame = o end end)
		end
	end
end

Remotes.BreakableUpdate.OnClientEvent:Connect(function(m: Model, frac: number, broke: boolean, value: number)
	if not m or not m.Parent then return end
	hpLocal[m] = frac
	local def = Config.Breakables[m:GetAttribute("Breakable")]
	local kind = def and def.sound or "Wood"
	if broke then
		brokenLocal[m] = true
		debrisBurst(m, kind)
		hideModelLocal(m)
		playAt(Config.Sounds[kind], m:GetPivot().Position, 1.6, 0.9 + math.random() * 0.2)
		hud.moneyPopup(value)
		shake = math.max(shake, 0.6)
	else
		wobble(m, frac)
	end
end)

Remotes.HitFx.OnClientEvent:Connect(function(kind, pos, snd, broke)
	if kind == "Bleed" then
		hud.flash(Color3.fromRGB(120, 0, 0), 0.6, 0.5)
		hud.bloodScreen(1)
		shake = math.max(shake, 0.8)
		hud.notify("Suas mãos estão sangrando! Use ataduras [F]", "death")
	elseif kind == "Remote" and pos then
		playAt(Config.Sounds[snd] or Config.Sounds.Wood, pos, broke and 1.3 or 0.6, broke and 0.85 or 1.3)
	end
end)

local function hitChips(pos: Vector3, normal: Vector3, color: Color3, mat: Enum.Material, n: number)
	for _ = 1, n do
		local c = Instance.new("Part")
		local sz = 0.08 + math.random() * 0.18
		c.Size = Vector3.new(sz, sz * (0.4 + math.random()), sz)
		c.Color = color; c.Material = mat; c.CanQuery = false; c.CanTouch = false; c.CanCollide = true
		c.CFrame = CFrame.new(pos + normal * 0.2) * CFrame.Angles(math.random() * 6, math.random() * 6, math.random() * 6)
		c.Parent = workspace
		local spread = Vector3.new(math.random() - 0.5, math.random() - 0.2, math.random() - 0.5) * 14
		c.AssemblyLinearVelocity = normal * (8 + math.random() * 10) + spread
		c.AssemblyAngularVelocity = Vector3.new(math.random(-30, 30), math.random(-30, 30), math.random(-30, 30))
		Debris:AddItem(c, 2.5)
	end
end

-- retorna "dureza" do alvo (0..1) se acertou algo, ou nil
local function doHit(): number?
	local res = aimRay(Config.HAMMER_RANGE)
	local m = res and findBreakable(res.Instance)
	if m and not brokenLocal[m] then
		Remotes.Hit:FireServer(m)
		local def = Config.Breakables[m:GetAttribute("Breakable")]
		playAt(Config.Sounds[def and def.sound or "Wood"], res.Position, 0.8, 1.25 + math.random() * 0.25)
		hud.hitPulse()
		local hard = def and math.clamp(def.hp / 18, 0.1, 1) or 0.3
		shake = math.max(shake, 0.35 + hard * 0.5)
		local inst = res.Instance :: BasePart
		hitChips(res.Position, res.Normal, inst.Color, inst.Material, 4 + math.floor(hard * 6))
		lastHitPos = res.Position
		return hard
	elseif res then
		playAt(Config.Sounds.Wood, res.Position, 0.35, 1.6)
		shake = math.max(shake, 0.15)
		local inst = res.Instance
		if inst:IsA("BasePart") then hitChips(res.Position, res.Normal, inst.Color, inst.Material, 3) end
		return 0.15
	end
	return nil
end

local function trySwing()
	if swingT >= 0 or bandageT >= 0 or equipT < 0.6 or not isSurvivor() or hiding() then return end
	if not hum or hum.Health <= 0 then return end
	swingT = 0
	swingHitDone = false
	swingSide = not swingSide
	if slashTrack then pcall(function() slashTrack:Play(0.05, 1, 1.4) end) end
end

local function tryBandage()
	if bandageT >= 0 or swingT >= 0 or not isSurvivor() then return end
	if (player:GetAttribute("Bandages") or 0) <= 0 then hud.notify("Você não tem ataduras.", "death"); return end
	if (player:GetAttribute("Hands") or 0) >= Config.HAND_MAX then hud.notify("Suas mãos estão boas.", "info"); return end
	bandageT = 0
	task.delay(1.0, function() Remotes.UseBandage:FireServer() end)
end

-- ===================== lanterna =====================
local function setFlash(on: boolean)
	if on and blackoutActive() then hud.notify("A lanterna não liga no apagão!", "death"); return end
	if on and (not player:GetAttribute("HasFlashlight") or battery <= 0.03) then
		if not player:GetAttribute("HasFlashlight") then hud.notify("Você não tem uma lanterna.", "info") end
		return
	end
	if flashOn == on then return end
	flashOn = on
	if not on then lastFlashOff = os.clock() end
	Remotes.Flashlight:FireServer(on)
	play2D(Config.Sounds.Click, 0.45, on and 1.35 or 1)
end

-- ===================== monstro (jogador) =====================
local lastAttack = 0
local function monsterAttack()
	if not isMonster() or os.clock() - lastAttack < 1.1 then return end
	lastAttack = os.clock()
	Remotes.MonsterAttack:FireServer()
	shake = math.max(shake, 0.9)
	hud.flash(Color3.fromRGB(90, 0, 0), 0.6, 0.35)
end

local function useAbility(name: string)
	if not isMonster() then return end
	local def = Config.MonsterAbilities[name]
	if not def then return end
	if not hasSkill(def.skill) then hud.notify("Desbloqueie " .. def.name .. " na árvore do Monstro.", "death"); return end
	local now = os.clock()
	if now < abilityCD[name] then return end
	abilityCD[name] = now + def.cooldown
	Remotes.MonsterAbility:FireServer(name)
	if name == "Lunge" then
		lungeUntil = now + 0.55; shake = 1; camera.FieldOfView = Settings.fov + 26
	elseif name == "Scream" then
		shake = 1.3; hud.flash(Color3.fromRGB(180, 0, 0), 0.5, 0.8)
	elseif name == "Echo" then
		hud.flash(Color3.fromRGB(255, 80, 80), 0.75, 1)
	end
end

-- habilidade única do tipo de monstro [R]
local function useSpecial()
	if not isMonster() then return end
	local def = myMonsterDef()
	local now = os.clock()
	if now < specialCD then return end
	specialCD = now + def.ability.cooldown
	Remotes.MonsterSpecial:FireServer()
	shake = math.max(shake, 0.8)
	if def.ability.id == "Rampage" then rampageUntil = now + 0.85; camera.FieldOfView = Settings.fov + 30 end
	hud.flash(Color3.fromRGB(150, 0, 0), 0.6, 0.6)
	hud.notify(K.upper(def.ability.name) .. "!", "monster")
end

local function echoHighlight(c: Model, dur: number)
	local h = c:FindFirstChild("EchoHL") or Instance.new("Highlight")
	h.Name = "EchoHL"; h.FillColor = Color3.fromRGB(255, 30, 30); h.FillTransparency = 0.5; h.OutlineColor = Color3.new(1, 1, 1)
	h.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop; h.Parent = c
	local token = os.clock(); h:SetAttribute("T", token)
	task.delay(dur, function() if h.Parent and h:GetAttribute("T") == token then h:Destroy() end end)
end

Remotes.NoisePing.OnClientEvent:Connect(function(pos: Vector3, radius: number)
	if not isMonster() then return end
	local ring = Instance.new("Part"); ring.Shape = Enum.PartType.Ball; ring.Anchored = true; ring.CanCollide = false; ring.CanQuery = false
	ring.Material = Enum.Material.Neon; ring.Color = Color3.fromRGB(255, 40, 40); ring.Transparency = 0.6; ring.Size = Vector3.one * 2; ring.Position = pos; ring.Parent = workspace
	TS:Create(ring, TweenInfo.new(0.9, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Size = Vector3.one * math.min(radius, 30), Transparency = 1 }):Play()
	Debris:AddItem(ring, 1)
	for _, p in ipairs(Players:GetPlayers()) do
		local c = p.Character
		local r = c and c:FindFirstChild("HumanoidRootPart")
		if r and p ~= player and (r.Position - pos).Magnitude < 5 then echoHighlight(c, 1.6) end
	end
end)

Remotes.MonsterVision.OnClientEvent:Connect(function(chars, dur)
	for _, c in ipairs(chars) do if c and c.Parent then echoHighlight(c, dur or 2.5) end end
	if #chars == 0 then hud.notify("Nenhum eco por perto...", "info") end
end)

local sniffAcc = 0
local function updateSniffer(dt)
	sniffAcc += dt
	if sniffAcc < 0.4 then return end
	sniffAcc = 0
	local map = workspace:FindFirstChild("ActiveMap")
	local lockers = map and map:FindFirstChild("Lockers")
	if not lockers then return end
	local active = isMonster() and hasSkill("M_Sniffer") and root
	local occupied = {}
	if active then
		for _, p in ipairs(Players:GetPlayers()) do
			local id = p:GetAttribute("Hiding")
			if id then occupied[id] = true end
		end
	end
	for _, l in ipairs(lockers:GetChildren()) do
		local on = active and occupied[l:GetAttribute("LId")] and (l:GetPivot().Position - root.Position).Magnitude < 18
		local h = l:FindFirstChild("SniffHL")
		if on and not h then
			h = Instance.new("Highlight"); h.Name = "SniffHL"; h.FillColor = Color3.fromRGB(200, 0, 0); h.OutlineColor = Color3.fromRGB(255, 80, 80)
			h.DepthMode = Enum.HighlightDepthMode.Occluded; h.Parent = l
		elseif not on and h then
			h:Destroy()
		end
		if h and h.Parent then h.FillTransparency = 0.55 + math.sin(os.clock() * 6) * 0.3 end
	end
end

-- ===================== espectar =====================
local function specTargets()
	local t = {}
	for _, p in ipairs(Players:GetPlayers()) do
		local r = p:GetAttribute("Role")
		if p ~= player and (r == "Survivor" or r == "Monster") and p.Character and p.Character:FindFirstChildOfClass("Humanoid") then
			table.insert(t, { name = p.DisplayName .. (r == "Monster" and "  ·  BLINDER" or ""), hum = p.Character:FindFirstChildOfClass("Humanoid") })
		end
	end
	for _, m in ipairs(CS:GetTagged("Monster")) do
		local h = m:FindFirstChildOfClass("Humanoid")
		if h then table.insert(t, { name = "O BLINDER", hum = h }) end
	end
	return t
end

local function stopSpectate()
	spectating = false
	hud.spectate.Visible = false
	if hum then camera.CameraSubject = hum end
end
local function startSpectate()
	if isSurvivor() or isMonster() or inTitle then return end
	if Shared:GetAttribute("Phase") ~= "Round" then hud.notify("Nenhuma noite em andamento agora.", "info"); return end
	if #specTargets() == 0 then hud.notify("Ninguém para espectar.", "info"); return end
	stopEmote()
	spectating = true
	hud.spectate.Visible = true
	Menu.toggle(false)
end
Menu.onSpectate = function() if spectating then stopSpectate() else startSpectate() end end
hud.specPrev.MouseButton1Click:Connect(function() specIndex -= 1 end)
hud.specNext.MouseButton1Click:Connect(function() specIndex += 1 end)

-- ===================== input =====================
local TAB_KEYS = { [Enum.KeyCode.B] = "Upgrades", [Enum.KeyCode.I] = "Items", [Enum.KeyCode.H] = "Skills", [Enum.KeyCode.K] = "Monsters", [Enum.KeyCode.J] = "Skins", [Enum.KeyCode.U] = "Hammers", [Enum.KeyCode.G] = "Emotes", [Enum.KeyCode.P] = "Profile", [Enum.KeyCode.O] = "Settings" }
UIS.InputBegan:Connect(function(input, gp)
	if gp or inTitle then return end
	local inLobbyRole = not isSurvivor() and not isMonster()
	local kc = input.KeyCode
	if input.UserInputType == Enum.UserInputType.MouseButton1 or kc == Enum.KeyCode.ButtonR2 then
		if Menu.open or Menu.cursorMode() then return end
		if isMonster() then monsterAttack() else trySwing() end
	elseif kc == Enum.KeyCode.F then
		if isMonster() then useAbility("Scream") else tryBandage() end
	elseif kc == Enum.KeyCode.L then
		if not isMonster() then setFlash(not flashOn) end
	elseif kc == Enum.KeyCode.Q then
		useAbility("Lunge")
	elseif kc == Enum.KeyCode.R then
		useSpecial()
	elseif kc == Enum.KeyCode.C then
		useAbility("Echo")
	elseif kc == Enum.KeyCode.M and inLobbyRole then
		Menu.setCursorMode(not Menu.cursorMode())
	elseif TAB_KEYS[kc] and inLobbyRole then
		local tab = TAB_KEYS[kc]
		Menu.click()
		Menu.toggle(not (Menu.open and Menu.current == tab), tab)
	elseif kc == Enum.KeyCode.V and inLobbyRole then
		if spectating then stopSpectate() else startSpectate() end
	elseif kc == Enum.KeyCode.Left and spectating then
		specIndex -= 1
	elseif kc == Enum.KeyCode.Right and spectating then
		specIndex += 1
	-- ===== controle (console) =====
	elseif kc == Enum.KeyCode.ButtonY then
		if isMonster() then useSpecial() else tryBandage() end
	elseif kc == Enum.KeyCode.ButtonR1 then
		if isMonster() then useAbility("Lunge") else setFlash(not flashOn) end
	elseif kc == Enum.KeyCode.ButtonL1 then
		useAbility("Echo")
	elseif kc == Enum.KeyCode.ButtonB then
		if Menu.open then Menu.toggle(false) elseif isMonster() then useAbility("Scream") elseif spectating then stopSpectate() end
	elseif kc == Enum.KeyCode.ButtonSelect and inLobbyRole then
		Menu.click()
		Menu.toggle(not Menu.open, Menu.current)
	elseif (kc == Enum.KeyCode.DPadLeft or kc == Enum.KeyCode.DPadRight) and spectating then
		specIndex += (kc == Enum.KeyCode.DPadLeft) and -1 or 1
	elseif kc == Enum.KeyCode.DPadUp and inLobbyRole and not Menu.open then
		if spectating then stopSpectate() else startSpectate() end
	elseif kc == Enum.KeyCode.Escape and Menu.open then
		Menu.toggle(false)
	end
end)

-- dicas de teclas trocam conforme o aparelho (teclado / controle / toque)
local function refreshInputMode()
	K.applyInputMode(hud.gui, K.inputMode())
end
refreshInputMode()
UIS.LastInputTypeChanged:Connect(function() task.defer(refreshInputMode) end)
local function gamepadDown(k) return UIS:IsGamepadButtonDown(Enum.UserInputType.Gamepad1, k) end

-- ===================== controles de celular =====================
local mobileSprint = false
if UIS.TouchEnabled then
	local layer = hud.mobileLayer
	local holder = K.new("Frame", { AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -24, 1, -140), Size = UDim2.fromOffset(280, 280), BackgroundTransparency = 1, Parent = layer })
	local function mbtn(text, pos, size)
		return K.new("TextButton", { AutoButtonColor = false, Text = text, FontFace = FF.bodyB, TextSize = 14, TextColor3 = C.text, TextWrapped = true,
			AnchorPoint = Vector2.new(0.5, 0.5), Position = pos, Size = UDim2.fromOffset(size, size), BackgroundColor3 = C.bg, BackgroundTransparency = 0.35, Parent = holder }, { K.corner(size / 2), K.stroke(C.line, 1.5, 0.7) })
	end
	local action = mbtn("🔨", UDim2.fromOffset(205, 205), 96); action.TextSize = 36
	local sprint = mbtn("CORRER", UDim2.fromOffset(90, 222), 72)
	local b1 = mbtn("🩹", UDim2.fromOffset(215, 88), 62); b1.TextSize = 26
	local lamp = mbtn("🔦", UDim2.fromOffset(120, 118), 56); lamp.TextSize = 24
	local b2 = mbtn("Q", UDim2.fromOffset(120, 118), 56)
	local b3 = mbtn("C", UDim2.fromOffset(52, 150), 50)
	local b4 = mbtn("★", UDim2.fromOffset(215, 88), 62); b4.TextSize = 28; b4.TextColor3 = C.red
	b4.InputBegan:Connect(function(i) if i.UserInputType == Enum.UserInputType.Touch then useSpecial() end end)
	local function touch(btn, fn) btn.InputBegan:Connect(function(i) if i.UserInputType == Enum.UserInputType.Touch then fn() end end) end
	touch(action, function() if isMonster() then monsterAttack() else trySwing() end end)
	touch(sprint, function() mobileSprint = not mobileSprint; sprint.BackgroundColor3 = mobileSprint and C.redDim or C.bg end)
	touch(b1, function() if isMonster() then useAbility("Scream") else tryBandage() end end)
	touch(lamp, function() setFlash(not flashOn) end)
	touch(b2, function() useAbility("Lunge") end)
	touch(b3, function() useAbility("Echo") end)
	RunService.Heartbeat:Connect(function()
		local s, m = isSurvivor(), isMonster()
		holder.Visible = (s or m) and not hiding() and not inTitle
		action.Text = m and "💀" or "🔨"
		b1.Text = m and "F" or "🩹"
		b2.Visible = m; b3.Visible = m; b4.Visible = m; b1.Visible = not m
		lamp.Visible = s and player:GetAttribute("HasFlashlight") == true
		if not (s or m) and mobileSprint then mobileSprint = false; sprint.BackgroundColor3 = C.bg end
	end)
end

-- ===================== prompts personalizados =====================
local promptGuis = {}
PPS.PromptShown:Connect(function(prompt: ProximityPrompt)
	if prompt.Style ~= Enum.ProximityPromptStyle.Custom then return end
	local adornee = prompt.Parent
	if not adornee or not adornee:IsA("BasePart") then return end
	local action = prompt.ActionText
	if prompt.Name == "HidePrompt" then
		if isMonster() then action = "Abrir" elseif hiding() then action = "Sair" else action = "Esconder" end
	end
	local bb = K.new("BillboardGui", { Name = "Prompt", Adornee = adornee, AlwaysOnTop = true, Active = true, Size = UDim2.fromOffset(250, 58), LightInfluence = 0, Parent = hud.promptLayer })
	local frame = K.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = bb })
	local key = K.new("TextButton", { Text = "", AutoButtonColor = false, AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 4, 0.5, 0), Size = UDim2.fromOffset(42, 42), BackgroundColor3 = C.bg, BackgroundTransparency = 0.15, Parent = frame }, { K.corner(4), K.stroke(C.line, 1, 0.6) })
	local mode = K.inputMode()
	local keyText = (mode == "touch") and "👆" or (mode == "gamepad" and prompt.GamepadKeyCode.Name:gsub("Button", "") or prompt.KeyboardKeyCode.Name)
	K.label({ Size = UDim2.fromScale(1, 1), Text = keyText, FontFace = FF.head, TextSize = 20, TextXAlignment = Enum.TextXAlignment.Center, Parent = key })
	local fill = K.new("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 0), Size = UDim2.new(0, 0, 0, 3), BackgroundColor3 = C.red, Parent = key })
	local pill = K.new("Frame", { Position = UDim2.fromOffset(52, 9), Size = UDim2.fromOffset(190, 40), BackgroundColor3 = C.bg, BackgroundTransparency = 0.35, Parent = frame }, { K.corner(4) })
	K.label({ Position = UDim2.fromOffset(10, 3), Size = UDim2.new(1, -16, 0, 20), Text = K.upper(action), FontFace = FF.head, TextSize = 17, Parent = pill })
	K.label({ Position = UDim2.fromOffset(10, 22), Size = UDim2.new(1, -16, 0, 14), Text = prompt.ObjectText, FontFace = FF.bodyM, TextSize = 13, TextColor3 = C.dim, Parent = pill })
	frame.Position = UDim2.fromOffset(0, 8)
	K.tween(frame, 0.2, { Position = UDim2.fromOffset(0, 0) })
	local conns = {}
	table.insert(conns, prompt.PromptButtonHoldBegan:Connect(function()
		fill.Size = UDim2.new(0, 0, 0, 3)
		TS:Create(fill, TweenInfo.new(prompt.HoldDuration, Enum.EasingStyle.Linear), { Size = UDim2.new(1, 0, 0, 3) }):Play()
	end))
	table.insert(conns, prompt.PromptButtonHoldEnded:Connect(function() fill.Size = UDim2.new(0, 0, 0, 3) end))
	table.insert(conns, key.InputBegan:Connect(function(i) if i.UserInputType == Enum.UserInputType.Touch then prompt:InputHoldBegin() end end))
	table.insert(conns, key.InputEnded:Connect(function(i) if i.UserInputType == Enum.UserInputType.Touch then prompt:InputHoldEnd() end end))
	promptGuis[prompt] = { bb = bb, conns = conns }
end)
PPS.PromptHidden:Connect(function(prompt)
	local g = promptGuis[prompt]
	if g then
		for _, c in ipairs(g.conns) do c:Disconnect() end
		g.bb:Destroy()
		promptGuis[prompt] = nil
	end
end)

-- ===================== armário (por dentro, em 3D) =====================
local hiddenDoor: BasePart? = nil
local lockerFx: Model? = nil
local breathEmitter: ParticleEmitter? = nil
local hideT = 0
local function buildLockerInterior(locker: Model, door: BasePart)
	local m = Instance.new("Model"); m.Name = "LockerInteriorLocal"
	local function pt(size, cf, color, mat, trans)
		local p = Instance.new("Part"); p.Anchored = true; p.CanCollide = false; p.CanQuery = false; p.CanTouch = false
		p.Size = size; p.CFrame = cf; p.Color = color; p.Material = mat or Enum.Material.Metal; p.Transparency = trans or 0
		p.Parent = m
		return p
	end
	local dcf, ds = door.CFrame, door.Size
	local col = door.Color:Lerp(Color3.new(0, 0, 0), 0.55)
	-- porta vista por dentro: chapas com frestas finas na altura dos olhos
	local slatH, gap = 0.3, 0.13
	local top = ds.Y / 2
	local y = top
	local eyeTop, eyeBot = 1.9, -0.2 -- faixa com frestas (relativa ao centro da porta)
	while y > -ds.Y / 2 do
		local h
		if y <= eyeTop and y > eyeBot then h = slatH else h = math.min(0.9, y + ds.Y / 2) end
		if h <= 0.01 then break end
		pt(Vector3.new(ds.X, h, 0.06), dcf * CFrame.new(0, y - h / 2, 0.02), col, Enum.Material.Metal)
		-- dobra da chapa (dá profundidade às frestas)
		if y <= eyeTop and y > eyeBot then
			pt(Vector3.new(ds.X, 0.05, 0.22), dcf * CFrame.new(0, y - h - 0.02, -0.08) * CFrame.Angles(math.rad(-35), 0, 0), col:Lerp(Color3.new(0, 0, 0), 0.3), Enum.Material.Metal)
			y -= h + gap
		else
			y -= h
		end
	end
	-- arranhões de unha por dentro da porta
	for k = 1, 4 do
		pt(Vector3.new(0.03, 0.9 + math.random() * 0.6, 0.02), dcf * CFrame.new(-0.9 + k * 0.35, -1.4, 0.06) * CFrame.Angles(0, 0, math.rad(math.random(-12, 12))), Color3.fromRGB(150, 140, 130), Enum.Material.SmoothPlastic)
	end
	-- recado rabiscado
	local note = pt(Vector3.new(0.9, 0.6, 0.02), dcf * CFrame.new(0.9, -0.6, 0.07) * CFrame.Angles(0, math.pi, math.rad(8)), Color3.fromRGB(210, 200, 170), Enum.Material.SmoothPlastic)
	local g = Instance.new("SurfaceGui"); g.Face = Enum.NormalId.Front; g.CanvasSize = Vector2.new(180, 120); g.Parent = note
	local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = 1; t.TextScaled = true; t.Font = Enum.Font.PermanentMarker; t.TextColor3 = Color3.fromRGB(120, 10, 10)
	t.Text = ({ "NÃO RESPIRE", "ele abre os armários", "eu fiquei 3 noites aqui", "fique quieto" })[math.random(1, 4)]; t.Parent = g
	-- luz fraquinha entrando pelas frestas e escuridão por dentro
	local glow = pt(Vector3.new(1, 1, 1), dcf * CFrame.new(0, 2, -1.5), Color3.new(), nil, 1)
	local sl = Instance.new("SpotLight"); sl.Face = Enum.NormalId.Back; sl.Angle = 60; sl.Range = 6; sl.Brightness = 0.6; sl.Color = Color3.fromRGB(170, 180, 210); sl.Shadows = true; sl.Parent = glow
	m.Parent = workspace.CurrentCamera
	return m
end

player:GetAttributeChangedSignal("Hiding"):Connect(function()
	local id = player:GetAttribute("Hiding")
	if hiddenDoor then hiddenDoor.LocalTransparencyModifier = 0; hiddenDoor = nil end
	if lockerFx then lockerFx:Destroy(); lockerFx = nil end
	if breathEmitter then breathEmitter.Parent:Destroy(); breathEmitter = nil end
	if id then
		local map = workspace:FindFirstChild("ActiveMap")
		local lockersF = map and map:FindFirstChild("Lockers")
		if lockersF then
			for _, l in ipairs(lockersF:GetChildren()) do
				if l:GetAttribute("LId") == id then
					hiddenDoor = l:FindFirstChild("Door")
					if hiddenDoor then
						hiddenDoor.LocalTransparencyModifier = 1
						for _, sl in ipairs(l:GetChildren()) do if sl.Name == "Slit" then sl.LocalTransparencyModifier = 1 end end
						lockerFx = buildLockerInterior(l, hiddenDoor)
					end
				end
			end
		end
		-- bafo saindo da boca no frio
		local a = Instance.new("Part"); a.Anchored = true; a.CanCollide = false; a.CanQuery = false; a.Transparency = 1; a.Size = Vector3.new(0.2, 0.2, 0.2); a.Parent = workspace.CurrentCamera
		local pe = Instance.new("ParticleEmitter"); pe.Texture = "rbxasset://textures/particles/smoke_main.dds"; pe.Rate = 0
		pe.Lifetime = NumberRange.new(0.8, 1.4); pe.Speed = NumberRange.new(0.6, 1.2); pe.SpreadAngle = Vector2.new(15, 15)
		pe.Size = NumberSequence.new(0.15, 0.7); pe.Transparency = NumberSequence.new(0.82, 1); pe.Color = ColorSequence.new(Color3.fromRGB(200, 205, 215)); pe.LightInfluence = 1; pe.EmissionDirection = Enum.NormalId.Front; pe.Parent = a
		breathEmitter = pe
		hideT = 0
		hud.lockerView.Visible = true
		play2D(Config.Sounds.Locker, 0.8, 0.7)
	else
		hud.lockerView.Visible = false
	end
end)

Remotes.LockerMinigame.OnClientEvent:Connect(function(token, difficulty, lungs, bonus)
	shake = math.max(shake, 0.4)
	play2D(Config.Sounds.Heartbeat, 1.5, 1.3)
	local ok = Minigame.run(hud.gui, difficulty, lungs or 0, bonus or 0)
	Remotes.LockerResult:FireServer(token, ok)
end)

-- ===================== jumpscare (estilo "o bicho pula na sua cara") =====================
local function staticLayer(parent, z)
	-- chuvisco de TV feito com uma grade de quadradinhos
	local f = K.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = z, Parent = parent })
	local cells = {}
	local CW, CH = 28, 16
	for x = 0, CW - 1 do
		for y = 0, CH - 1 do
			cells[#cells + 1] = K.new("Frame", { Position = UDim2.fromScale(x / CW, y / CH), Size = UDim2.new(1 / CW, 1, 1 / CH, 1), BorderSizePixel = 0, BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 1, ZIndex = z, Parent = f })
		end
	end
	local function step(amount: number)
		for _, c in ipairs(cells) do
			local v = math.random()
			c.BackgroundColor3 = Color3.new(v, v, v)
			c.BackgroundTransparency = 1 - amount * (0.35 + math.random() * 0.65)
		end
	end
	return f, step
end

local function jumpscare()
	local src
	local best = math.huge
	for _, m in ipairs(Animator.getMonsters()) do
		local r = m:FindFirstChild("HumanoidRootPart")
		local d = (r and root) and (r.Position - root.Position).Magnitude or 0
		if d < best then src, best = m, d end
	end
	local layer = K.new("Frame", { Name = "Jumpscare", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0, ZIndex = 50, Parent = hud.gui })
	local function mkVP(z, tint)
		local vp = K.new("ViewportFrame", { Size = UDim2.fromScale(1.12, 1.12), Position = UDim2.fromScale(-0.06, -0.06), BackgroundTransparency = 1, Ambient = Color3.fromRGB(70, 40, 40), LightColor = Color3.fromRGB(255, 200, 170), LightDirection = Vector3.new(0.2, -0.6, -1), ImageColor3 = tint, ZIndex = z, Parent = layer })
		local cam = Instance.new("Camera"); cam.FieldOfView = 70; cam.Parent = vp
		vp.CurrentCamera = cam
		return vp, cam
	end
	local vp, vcam = mkVP(51, Color3.new(1, 1, 1))
	local ghost, gcam = mkVP(52, Color3.fromRGB(255, 0, 0)) -- duplicata vermelha deslocada (glitch)
	ghost.ImageTransparency = 1
	local headCF = CFrame.new()
	local body: Model? = nil
	if src then
		pcall(function()
			local visual = src:FindFirstChild("MonsterVisual") or src
			local wm = Instance.new("WorldModel"); wm.Parent = vp
			body = Instance.new("Model"); body.Parent = wm
			for _, d in ipairs(visual:GetDescendants()) do
				if d:IsA("BasePart") and d.Name ~= "HumanoidRootPart" then
					d.Archivable = true
					local c = d:Clone()
					for _, ch in ipairs(c:GetChildren()) do if not (ch:IsA("DataModelMesh") or ch:IsA("Decal") or ch:IsA("SurfaceAppearance")) then ch:Destroy() end end
					c.Anchored = true; c.Transparency = math.min(c.Transparency, 0.1); c.Parent = body
					if d.Name == "Head" then headCF = d.CFrame end
				end
			end
			if headCF == CFrame.new() then headCF = (body :: Model):GetPivot() * CFrame.new(0, 3, 0) end
			local wm2 = wm:Clone(); wm2.Parent = ghost
		end)
	end
	-- olhos vermelhos brilhando no fundo da tela
	local face = headCF
	local function camAt(dist: number, jx: number, jy: number, roll: number)
		local pos = (face * CFrame.new(0, -0.15, -dist)).Position
		return CFrame.lookAt(pos, face.Position) * CFrame.Angles(jx, jy, roll)
	end
	local _, staticStep = staticLayer(layer, 55)
	local origPivot = body and (body :: Model):GetPivot()
	local flash = K.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 1, ZIndex = 56, Parent = layer })

	shake = 2
	play2D(Config.Sounds.Jumpscare, 3.5, 0.95)
	play2D(Config.Sounds.Scream, 3, 0.9 + math.random() * 0.15)
	task.delay(0.08, function() play2D(Config.Sounds.Scream, 2.2, 0.6) end)
	local t0 = os.clock()
	local DUR = 1.75
	local conn
	conn = RunService.RenderStepped:Connect(function()
		local t = os.clock() - t0
		-- 0.00-0.10: tela preta + chuvisco
		-- 0.10-0.32: avança do escuro até a sua cara
		-- 0.32-1.55: cara colada na tela, cabeça sacudindo violentamente
		-- 1.55-1.75: chuvisco forte e corte
		local dist
		if t < 0.1 then dist = 14
		elseif t < 0.32 then local a = (t - 0.1) / 0.22; dist = 14 - (a ^ 0.45) * 12.6
		else dist = 1.4 + math.sin(t * 38) * 0.18 end
		local violent = t > 0.3 and 1 or 0.3
		local jx = (math.random() - 0.5) * 0.22 * violent
		local jy = (math.random() - 0.5) * 0.22 * violent
		local roll = math.sin(t * 27) * 0.28 * violent + (math.random() - 0.5) * 0.15
		local cf = camAt(dist, jx, jy, roll)
		vcam.CFrame = cf
		vcam.FieldOfView = 70 - math.clamp((t - 0.1) / 0.22, 0, 1) * 22 + math.sin(t * 50) * 3
		gcam.CFrame = cf * CFrame.new(0.08 + math.random() * 0.1, 0, 0)
		gcam.FieldOfView = vcam.FieldOfView
		ghost.ImageTransparency = (t > 0.3 and math.random() < 0.5) and 0.55 or 1
		-- cabeça do bicho chacoalhando de um lado para o outro
		if body then
			local wob = CFrame.Angles(math.sin(t * 31) * 0.12, math.sin(t * 23) * 0.18, math.sin(t * 29) * 0.22)
			pcall(function() (body :: Model):PivotTo(CFrame.new(face.Position) * wob * CFrame.new(-face.Position) * origPivot) end)
		end
		vp.ImageColor3 = (math.floor(t * 24) % 3 == 0) and Color3.fromRGB(255, 120, 120) or Color3.new(1, 1, 1)
		vp.Visible = t > 0.1 and t < 1.6
		ghost.Visible = vp.Visible
		local st = (t < 0.1 and 0.9) or (t < 0.32 and 0.25) or (t < 1.55 and 0.12) or 1
		staticStep(st)
		flash.BackgroundTransparency = (t > 0.3 and t < 0.36) and 0.1 or ((math.random() < 0.06 and t < 1.5) and 0.75 or 1)
		flash.BackgroundColor3 = math.random() < 0.5 and Color3.new(1, 1, 1) or Color3.fromRGB(200, 0, 0)
		shake = math.max(shake, 1.2)
		hud.gui.FX.Position = UDim2.fromOffset(math.random(-14, 14), math.random(-14, 14))
	end)
	task.wait(DUR)
	conn:Disconnect()
	hud.gui.FX.Position = UDim2.fromOffset(0, 0)
	layer:Destroy()
	hud.death.Visible = true
	hud.death.BackgroundTransparency = 0
	hud.deathTitle.TextTransparency = 1
	hud.deathSub.TextTransparency = 1
	hud.deathTitle.Position = UDim2.fromScale(0.5, 0.42)
	hud.deathSub.Text = "O dinheiro desta noite foi perdido."
	-- sangue escorrendo do título
	for i = 1, 14 do
		local drip = K.new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, math.random(-380, 380), 0.42, 30), Size = UDim2.fromOffset(math.random(3, 9), 0), BackgroundColor3 = Color3.fromRGB(120 + math.random(0, 40), 0, 0), BorderSizePixel = 0, ZIndex = 41, Parent = hud.death }, { K.corner(4) })
		task.delay(0.3 + math.random() * 0.8, function()
			K.tween(drip, 2 + math.random() * 2, { Size = UDim2.fromOffset(drip.Size.X.Offset, math.random(60, 320)) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		end)
		task.delay(6, function() drip:Destroy() end)
	end
	K.tween(hud.deathTitle, 0.25, { TextTransparency = 0, Position = UDim2.fromScale(0.5, 0.45) }, Enum.EasingStyle.Back)
	task.delay(0.6, function() K.tween(hud.deathSub, 1.2, { TextTransparency = 0 }) end)
end
Remotes.Jumpscare.OnClientEvent:Connect(function() task.spawn(jumpscare) end)

-- ===================== efeitos das habilidades no mundo =====================
local function burst(pos: Vector3, color: Color3, count: number, speed: number, size: number, life: number)
	local a = Instance.new("Part"); a.Anchored = true; a.CanCollide = false; a.CanQuery = false; a.Transparency = 1; a.Size = Vector3.one; a.Position = pos; a.Parent = workspace
	local pe = Instance.new("ParticleEmitter")
	pe.Texture = "rbxasset://textures/particles/smoke_main.dds"; pe.Color = ColorSequence.new(color)
	pe.Size = NumberSequence.new(size, size * 2.5); pe.Transparency = NumberSequence.new(0.2, 1)
	pe.Lifetime = NumberRange.new(life * 0.6, life); pe.Speed = NumberRange.new(speed * 0.5, speed); pe.SpreadAngle = Vector2.new(180, 180)
	pe.Rate = 0; pe.LightInfluence = 0.3; pe.Parent = a
	pe:Emit(count)
	Debris:AddItem(a, life + 0.5)
end
local function crowFlock(pos: Vector3)
	for i = 1, 7 do
		local b = Instance.new("Part"); b.Anchored = true; b.CanCollide = false; b.CanQuery = false; b.Size = Vector3.new(0.7, 0.25, 0.5); b.Color = Color3.fromRGB(10, 10, 12); b.Material = Enum.Material.SmoothPlastic
		local start = pos + Vector3.new(math.random(-6, 6), math.random(3, 7), math.random(-6, 6))
		b.CFrame = CFrame.new(start); b.Parent = workspace
		local target = pos + Vector3.new(math.random(-2, 2), math.random(1, 3), math.random(-2, 2))
		TS:Create(b, TweenInfo.new(0.5 + math.random() * 0.4, Enum.EasingStyle.Quad), { CFrame = CFrame.lookAt(target, target + Vector3.new(math.random() - 0.5, 0.3, math.random() - 0.5)) * CFrame.Angles(0, 0, math.random() - 0.5) }):Play()
		task.delay(1.2, function() TS:Create(b, TweenInfo.new(0.8), { Transparency = 1, CFrame = b.CFrame + Vector3.new(math.random(-8, 8), 10, math.random(-8, 8)) }):Play() end)
		Debris:AddItem(b, 2.2)
	end
	burst(pos + Vector3.new(0, 3, 0), Color3.fromRGB(15, 12, 14), 25, 10, 0.6, 1.2)
end
Remotes.WorldFx.OnClientEvent:Connect(function(kind, pos, list)
	if kind == "Crows" then
		for _, p in ipairs(list or {}) do crowFlock(p) end
		if isSurvivor() and (player:GetAttribute("PanicUntil") or 0) > serverNow() then
			hud.flash(Color3.new(0, 0, 0), 0.25, 1.2); shake = math.max(shake, 1)
			hud.showBanner("CORVOS", "Seu fôlego sumiu. Corra como puder.", C.red, 2.5)
		end
	elseif kind == "Blackout" then
		play2D(Config.Sounds.Locker, 1.2, 0.5)
		if isSurvivor() then hud.showBanner("APAGÃO", "Todas as luzes morreram. Ele está vindo.", C.red, 3) end
		hud.flash(Color3.new(0, 0, 0), 0.1, 1.5)
	elseif kind == "Shadow" then
		burst(pos + Vector3.new(0, 4, 0), Color3.fromRGB(5, 5, 8), 40, 8, 1.4, 1.6)
		for _, p in ipairs(list or {}) do burst(p + Vector3.new(0, 4, 0), Color3.fromRGB(5, 5, 8), 50, 10, 1.6, 1.8) end
	elseif kind == "Silence" then
		burst(pos + Vector3.new(0, 4, 0), Color3.fromRGB(230, 225, 220), 20, 4, 0.8, 1.2)
	end
end)

-- ===================== notificações / papéis =====================
Remotes.Notify.OnClientEvent:Connect(function(text, kind)
	if inTitle and kind ~= "level" then return end
	hud.notify(text, kind)
	if kind == "exits" then
		hud.showBanner("AS SAÍDAS ABRIRAM", "Encontre uma porta vermelha e fuja com o dinheiro.", C.green, 3.5)
		play2D(Config.Sounds.Locker, 1, 0.6)
	elseif kind == "monster" and text == "O BLINDER ACORDOU" then
		if isSurvivor() then hud.showBanner("ELE ACORDOU", "Não corra perto dele. Ele caça pelo som.", C.red, 3.5) end
		play2D(Config.Sounds.Scream, 1.2, 0.7)
		shake = 1
	elseif kind == "escape" then
		hud.showBanner("VOCÊ FUGIU", text:match("%+%$%d+") or "", C.gold, 4)
	elseif kind == "level" then
		hud.showBanner("NÍVEL " .. (player:GetAttribute("Level") or ""), "Novo ponto de habilidade  ·  abra o menu [H]", C.gold, 4)
		play2D(Config.Sounds.Click, 1, 1.6)
	end
end)

local lastRole = role()
player:GetAttributeChangedSignal("Role"):Connect(function()
	local r = role()
	if r == lastRole then return end
	lastRole = r
	Menu.toggle(false)
	stopEmote()
	if spectating then stopSpectate() end
	if r == "Survivor" then
		stamina = maxStamina()
		equipT = 0
		battery = 1
		hintUntil = os.clock() + 14
		hud.showBanner("SOBREVIVA", "Quebre objetos, junte dinheiro e fuja. Ele é cego: caça pelo SOM.", C.red, 5)
	elseif r == "Monster" then
		stamina = maxStamina()
		abilityCD.Lunge, abilityCD.Echo, abilityCD.Scream = 0, 0, 0
		hintUntil = os.clock() + 14
		hud.showBanner("VOCÊ É O BLINDER", "Você é cego. Siga os ecos vermelhos. Devore todos.", C.red, 5)
	elseif r == "Spectator" then
		task.delay(3.5, function() if role() == "Spectator" then hud.notify("[V] espectar  ·  [M] cursor  ·  ou suba a torre do relógio", "info") end end)
	end
	if r ~= "Survivor" then if flashOn then setFlash(false) end end
end)

Shared:GetAttributeChangedSignal("Phase"):Connect(function()
	if Shared:GetAttribute("Phase") == "Intermission" then
		table.clear(brokenLocal); table.clear(hpLocal)
		if spectating then stopSpectate() end
	end
end)

local function fmtTime(s: number) return string.format("%d:%02d", math.floor(s / 60), s % 60) end

-- ===================== luzes / TV do mapa =====================
local flickerAcc = 0
local function updateWorldFx(dt, monsterPos: Vector3?, nightmare: boolean)
	flickerAcc += dt
	if flickerAcc < 0.06 then return end
	flickerAcc = 0
	local map = workspace:FindFirstChild("ActiveMap")
	if not map then return end
	local radius = nightmare and 48 or 32
	local blackout = blackoutActive()
	for _, bulb in ipairs(CS:GetTagged("MapLight")) do
		if bulb:IsDescendantOf(map) then
			local light = bulb:FindFirstChildWhichIsA("Light")
			if light then
				local base = light:GetAttribute("Base") or light.Brightness
				if light:GetAttribute("Base") == nil then light:SetAttribute("Base", base) end
				local near = monsterPos and (monsterPos - bulb.Position).Magnitude < radius
				local on = true
				if blackout then on = false
				elseif near then on = (not nightmare) and math.random() > 0.45
				elseif bulb:GetAttribute("Flicker") then on = math.random() > 0.06 end
				light.Brightness = on and base * (near and 0.6 or (0.9 + math.random() * 0.1)) or 0
				if bulb.Material == Enum.Material.Neon then bulb.Transparency = on and 0 or 0.7 end
			end
		end
	end
	local brk = map:FindFirstChild("Breakables")
	if not brk then return end
	for _, d in ipairs(brk:GetDescendants()) do
		if d:IsA("BasePart") and d:GetAttribute("Static") and d.Transparency < 1 then
			local v = math.random() * 0.5 + 0.3
			d.Color = Color3.new(v, v, v * 1.1)
		end
	end
end

local function getMonster(): (Vector3?, Model?)
	local best, bm, bd = nil, nil, math.huge
	for _, m in ipairs(Animator.getMonsters()) do
		local r = m:FindFirstChild("HumanoidRootPart")
		if r and m ~= char then
			local d = root and (r.Position - root.Position).Magnitude or 0
			if d < bd then best, bm, bd = r.Position, m, d end
		end
	end
	return best, bm
end

-- ===================== tela inicial =====================
hud.setMode("title")
hudMode = "title"
Menu.setLobbyUI(false)
lobbyUIShown = false
task.defer(function() Remotes.MenuState:FireServer(true) end)
Title.run(player, hud, Menu, function()
	inTitle = false
	Remotes.MenuState:FireServer(false)
	lobbyUIShown = nil
	hudMode = nil
	if hum then hum.WalkSpeed = Config.WALK_SPEED; camera.CameraSubject = hum end
	player.CameraMode = Enum.CameraMode.LockFirstPerson
	hud.showBanner("VILA AURORA", "Explore a vila, suba o farol e prepare-se. A próxima noite começa em breve.", C.text, 3.5)
end)

-- ===================== loop principal =====================
local boardT = 0
RunService:BindToRenderStep("BlinderCamera", Enum.RenderPriority.Camera.Value + 1, function(dt)
	dt = math.min(dt, 0.1)
	local now = os.clock()
	hud.update(dt, Settings.grain)
	boardT += dt
	if boardT > 0.5 then boardT = 0; LobbyFx.updateBoard(Shared:GetAttribute("Phase") or "Intermission", Shared:GetAttribute("TimeLeft") or 0, Shared:GetAttribute("MapName")) end
	if inTitle then
		vmModel.Parent = nil
		return
	end
	local survivor = isSurvivor()
	local monster = isMonster()
	local mpos, mModel = getMonster()
	-- Boneca em silêncio: quase invisível e sem som para os sobreviventes
	if mModel then
		local silent = (mModel:GetAttribute("SilentUntil") or 0) > serverNow()
		if silent ~= (mModel:GetAttribute("_localSilent") == true) then
			mModel:SetAttribute("_localSilent", silent)
			for _, d in ipairs(mModel:GetDescendants()) do
				if d:IsA("BasePart") then d.LocalTransparencyModifier = silent and 0.88 or 0
				elseif d:IsA("Sound") then
					if silent then d:SetAttribute("_vol", d.Volume); d.Volume = 0 elseif d:GetAttribute("_vol") then d.Volume = d:GetAttribute("_vol") end
				elseif d:IsA("Light") then d.Enabled = not silent end
			end
		end
		if silent and survivor then mpos = nil end
	end
	local mDist = (mpos and root) and (mpos - root.Position).Magnitude or math.huge
	local presence = mModel and mModel:GetAttribute("Presence") and mDist < 25
	local nightmare = mModel ~= nil and mModel:GetAttribute("Nightmare") == true

	-- modos de HUD
	local mode = survivor and "survivor" or (monster and "monster" or "lobby")
	if mode ~= hudMode then hudMode = mode; hud.setMode(mode) end
	local showLobbyUI = not survivor and not monster
	if showLobbyUI ~= lobbyUIShown then lobbyUIShown = showLobbyUI; Menu.setLobbyUI(showLobbyUI) end

	-- ===== movimento / fôlego =====
	if hum and root and hum.Health > 0 then
		local moving = hum.MoveDirection.Magnitude > 0.1
		if emoteTrack and moving then stopEmote() end
		local wantSprint = (UIS:IsKeyDown(Enum.KeyCode.LeftShift) or gamepadDown(Enum.KeyCode.ButtonL2) or gamepadDown(Enum.KeyCode.ButtonL3) or mobileSprint) and moving and not hiding()
		if exhausted and stamina > maxStamina() * 0.3 then exhausted = false end
		sprinting = wantSprint and not exhausted and stamina > 0
		local walk = monster and (player:GetAttribute("MonWalk") or Config.MONSTER_WALK) or Config.WALK_SPEED
		local run = monster and ((player:GetAttribute("MonChase") or Config.MONSTER_CHASE) + (hasSkill("M_Stride") and 1.5 or 0) + ((blackoutActive() and myMonsterDef().ability.id == "Blackout") and 2.5 or 0)) or (Config.SPRINT_SPEED + 0.6 * (player:GetAttribute("Up_Speed") or 0))
		local panicked = survivor and (player:GetAttribute("PanicUntil") or 0) > serverNow()
		if panicked then stamina = 0; exhausted = true end
		if sprinting then
			stamina -= Config.STAMINA_DRAIN * dt * (monster and 0.6 or 1)
			lastSprint = now
			if stamina <= 0 then stamina = 0; exhausted = true; if survivor then hud.notify("Sem fôlego!", "death") end end
		elseif now - lastSprint > Config.STAMINA_REGEN_DELAY then
			stamina = math.min(maxStamina(), stamina + Config.STAMINA_REGEN * dt * (monster and 1.5 or 1) * (presence and survivor and 0.5 or 1))
		end
		local target = sprinting and run or (exhausted and walk * 0.75 or walk)
		if survivor and now < adrenalineUntil then target += 4 end
		if survivor and stunned() then target = 4 end
		if panicked then target *= 0.7 end
		if monster and now < lungeUntil then target = 48 end
		if monster and now < rampageUntil then target = 64 end
		local rate = (monster and (now < lungeUntil or now < rampageUntil)) and 30 or 8
		hum.WalkSpeed += (target - hum.WalkSpeed) * math.min(1, dt * rate)
		local oldMorph = monster and char ~= nil and char:FindFirstChild("MonsterVisual") ~= nil
		local camOff = Vector3.zero
		if oldMorph then
			camOff = Vector3.new(0, 4.2, -0.8)
		elseif monster and char and char:GetAttribute("RigKind") == "Mesh" then
			-- monstro gigante: câmera nos olhos (o Roblox colocaria no peito)
			local head = char:FindFirstChild("Head") :: BasePart
			if head then camOff = Vector3.new(0, (head.Position.Y - root.Position.Y) - 1.5, -0.7) end
		end
		hum.CameraOffset = hum.CameraOffset:Lerp(camOff, math.min(1, dt * 4))
	end

	-- ===== espectar =====
	if spectating then
		local t = specTargets()
		if #t == 0 then stopSpectate()
		else
			specIndex = ((specIndex - 1) % #t) + 1
			local e = t[specIndex]
			if camera.CameraSubject ~= e.hum then camera.CameraSubject = e.hum end
			hud.specName.Text = e.name
		end
	end

	-- ===== medo / perseguição =====
	local targetFear = 0
	chased = false
	if mpos and root and survivor then
		targetFear = math.clamp(1 - (mDist - 8) / 55, 0, 1)
		chased = mModel ~= nil and (mModel:GetAttribute("ChaseTarget") == player.Name or (mModel:GetAttribute("State") == "Chase" and mDist < 45) or (Players:GetPlayerFromCharacter(mModel) ~= nil and mDist < 30))
		if chased then targetFear = math.max(targetFear, 0.75) end
		if nightmare and mDist < 40 then targetFear = math.min(1, targetFear + 0.25) end
	end
	if hiding() and mpos and root then targetFear = math.max(targetFear, math.clamp(1 - mDist / 30, 0, 1)) end
	if survivor and chased and not wasChased and hasSkill("S_Adrenaline") and now > adrenalineCD then
		adrenalineUntil = now + 3; adrenalineCD = now + 25
		hud.notify("ADRENALINA!", "item")
	end
	wasChased = chased
	if survivor and stunned() then targetFear = 1; shake = math.max(shake, 0.6) end
	fear += (targetFear - fear) * math.min(1, dt * 3)
	heartbeat.Volume = fear * 1.8 * Settings.sfx
	heartbeat.PlaybackSpeed = 0.9 + fear * 0.6
	chaseMusic.Volume += ((chased and 1.1 * Settings.music or 0) - chaseMusic.Volume) * math.min(1, dt * (chased and 4 or 0.8))
	local inRound = Shared:GetAttribute("Phase") == "Round" and (survivor or monster or spectating)
	ambience.Volume += ((inRound and 0.45 * Settings.sfx or 0) - ambience.Volume) * math.min(1, dt)
	fearCC.TintColor = Color3.new(1, 1, 1):Lerp(Color3.fromRGB(255, 150, 150), fear * 0.8)
	fearCC.Saturation = -fear * 0.4 + (monster and -0.6 or 0)
	fearCC.Contrast = fear * 0.25 + ((nightmare and survivor and mDist < 40) and 0.3 or 0)
	fearBlur.Size = (fear > 0.7 and (fear - 0.7) * 12 or 0) + ((survivor and stunned()) and 8 or 0)
	hud.setFear(fear, now)
	if chased then shake = math.max(shake, 0.12 + fear * 0.12) end
	updateWorldFx(dt, mpos, nightmare)
	updateSniffer(dt)

	-- ===== lanterna (bateria e luz local) =====
	local hasLamp = player:GetAttribute("HasFlashlight") == true
	if flashOn and not hasLamp then flashOn = false end
	if flashOn and blackoutActive() then flashOn = false; lastFlashOff = now end
	fearCC.Brightness = blackoutActive() and -0.12 or 0
	if flashOn then
		battery -= (Config.Flashlight.batteryDrain / 100) * dt
		if battery <= 0 then battery = 0; setFlash(false); hud.notify("A bateria da lanterna acabou.", "death") end
	elseif now - lastFlashOff > Config.Flashlight.rechargeDelay then
		battery = math.min(1, battery + (Config.Flashlight.batteryRecharge / 100) * dt)
	end
	local thirdPerson = player.CameraMode ~= Enum.CameraMode.LockFirstPerson
	local lampVisible = flashOn and not spectating and not thirdPerson and hum ~= nil and hum.Health > 0
	camLight.Enabled = lampVisible
	camFill.Enabled = lampVisible
	if lampVisible then
		camLightPart.CFrame = camera.CFrame * CFrame.new(0.25, 0.15, -0.6)
		local flick = battery < 0.15 and (math.random() > 0.12 and 1 or 0.15) or 1
		camLight.Brightness = (2.4 + battery * 1.0) * flick
	end
	-- visão no escuro (bem fraca) e sustos de ambiente
	local inMap = (survivor or spectating) and Shared:GetAttribute("Phase") == "Round"
	nightEyePart.Parent = inMap and workspace.CurrentCamera or nil
	if inMap then nightEyePart.CFrame = camera.CFrame * CFrame.new(0, 0.5, 1.5); nightEye.Brightness = blackoutActive() and 0.12 or 0.32 end
	if survivor then
		scareT -= dt
		if scareT <= 0 then
			scareT = 25 + math.random() * 35
			local pos = camera.CFrame.Position + Vector3.new(math.random(-40, 40), 2, math.random(-40, 40))
			local pick = math.random(3)
			if pick == 1 then playAt(Config.Sounds.Growl, pos, 0.9, 0.6 + math.random() * 0.2)
			elseif pick == 2 then playAt(Config.Sounds.Locker, pos, 1.1, 0.5)
			else playAt(Config.Sounds.MonsterRun, pos, 0.7, 0.8) end
		end
	end
	-- desliga a luz da lanterna da própria cabeça (já usamos a da câmera)
	local myLamp = char and char:FindFirstChild("HeadLampModel")
	if myLamp then
		local b = myLamp:FindFirstChild("Beam")
		local sl = b and b:FindFirstChildOfClass("SpotLight")
		if sl then sl.Enabled = false end
	end

	-- ===== câmera: balanço, inclinação, FOV, tremor =====
	local camCF = camera.CFrame
	if hum and root and not spectating and not thirdPerson then
		local vel = root.AssemblyLinearVelocity
		local flat = Vector3.new(vel.X, 0, vel.Z).Magnitude
		local grounded = hum.FloorMaterial ~= Enum.Material.Air
		if grounded and flat > 1 and not hiding() then bobT += dt * flat * 0.62 end
		local amp = math.clamp(flat / 16, 0, 1.4) * (hiding() and 0 or 1) * (Settings.bob and 1 or 0)
		local right = camCF.RightVector:Dot(vel) / 16
		local roll = -right * 0.035 * (Settings.bob and 1 or 0.3) + math.sin(bobT) * 0.012 * amp
		camCF = camCF * CFrame.new(math.sin(bobT) * 0.09 * amp, -math.abs(math.cos(bobT)) * 0.14 * amp, 0) * CFrame.Angles(0, 0, roll)
		local fovTarget = Settings.fov + (sprinting and 12 or 0) + fear * 6
		if hiding() then
			fovTarget = Settings.fov - 14 - fear * 6
			-- respiração ofegante: peito sobe e desce, olhar treme quando ele está perto
			hideT += dt * (1 + fear * 2.2)
			local br = math.sin(hideT * 2.2)
			camCF = camCF * CFrame.new(0, br * 0.035, 0) * CFrame.Angles(br * 0.006 + (math.random() - 0.5) * fear * 0.004, math.sin(hideT * 0.7) * 0.01, 0)
			if breathEmitter and breathEmitter.Parent then
				(breathEmitter.Parent :: BasePart).CFrame = camCF * CFrame.new(0, -0.35, -0.5)
				if br > 0.97 and math.random() < 0.5 then breathEmitter:Emit(1 + math.floor(fear * 3)) end
			end
		end
		camera.FieldOfView += (fovTarget - camera.FieldOfView) * math.min(1, dt * 6)
	end
	if shake > 0.001 then
		local s = shake * shake * 0.06 * Settings.shake
		camCF = camCF * CFrame.Angles((math.random() - 0.5) * s, (math.random() - 0.5) * s, (math.random() - 0.5) * s * 0.6)
		shake = math.max(0, shake - dt * 2.2)
	end
	camera.CFrame = camCF

	-- ===== mãos e martelo =====
	local showVM = survivor and not hiding() and not spectating and not thirdPerson and hum ~= nil and hum.Health > 0
	vmModel.Parent = showVM and camera or nil
	if showVM then
		local delta = camera.CFrame:ToObjectSpace(lastCamCF)
		local rx, ry = delta:ToEulerAnglesYXZ()
		sway = sway:Lerp(Vector2.new(math.clamp(ry, -0.12, 0.12), math.clamp(rx, -0.12, 0.12)), math.min(1, dt * 9))
		sprintBlend += ((sprinting and 1 or 0) - sprintBlend) * math.min(1, dt * 8)
		local vel = root and root.AssemblyLinearVelocity or Vector3.zero
		local amp = math.clamp(Vector3.new(vel.X, 0, vel.Z).Magnitude / 16, 0, 1.3)
		local br = math.sin(now * 1.6)
		local off = CFrame.new(math.sin(bobT) * 0.045 * amp + sway.X * 1.1, -math.abs(math.cos(bobT)) * 0.06 * amp - sway.Y * 1.1 + br * 0.012, 0)
			* CFrame.Angles(sway.Y * 0.7 + br * 0.006, sway.X * 0.7, math.sin(bobT) * 0.02 * amp)
		local pose = BASE
		-- levantar o martelo no começo da rodada
		if equipT < 1 then
			equipT = math.min(1, equipT + dt / 0.55)
			local e = 1 - easeOut(equipT)
			pose = pose * CFrame.new(0, -1.3 * e, 0.5 * e) * CFrame.Angles(rad(-45) * e, 0, rad(10) * e)
		end
		-- correndo: martelo baixo e cruzado
		pose = pose:Lerp(BASE * SPRINT, sprintBlend * (swingT < 0 and 1 or 0.2))
		-- golpe: antecipação (puxa), arco rápido, trava no impacto (hitstop), quica e volta
		if swingT >= 0 then
			if hitstop > 0 then hitstop -= dt else swingT += dt end
			local t = swingT / SWING_DUR
			local W, S = (swingSide and WIND_SIDE or WIND), (swingSide and STRIKE_SIDE or STRIKE)
			local g
			if t < 0.34 then
				-- antecipação com leve tremor de força
				local a = easeOut(t / 0.34)
				g = CFrame.new():Lerp(W, a) * CFrame.Angles((math.random() - 0.5) * 0.01 * a, 0, 0)
			elseif t < 0.48 then
				local a = easeIn((t - 0.34) / 0.14)
				g = W:Lerp(S, a)
			elseif t < 0.6 then
				-- quique: o martelo volta um pouco depois de bater
				local a = math.sin(((t - 0.48) / 0.12) * math.pi)
				g = S * CFrame.new(0, 0.1 * a, 0.12 * a) * CFrame.Angles(rad(14) * a, 0, 0)
			else
				g = S:Lerp(CFrame.new(), 1 - (1 - math.clamp((t - 0.6) / 0.4, 0, 1)) ^ 2)
			end
			pose = pose * g
			if t >= 0.46 and not swingHitDone then
				swingHitDone = true
				local hard = doHit()
				if hard then
					kick = 1
					hitstop = 0.035 + hard * 0.05
				end
			end
			if swingT >= SWING_DUR then swingT = -1 end
		end
		-- recuo do impacto
		if kick > 0.001 then
			pose = pose * CFrame.new(0, 0.12 * kick, 0.2 * kick) * CFrame.Angles(rad(16) * kick, 0, rad(-4) * kick)
			kick = math.max(0, kick - dt * 6)
		end
		-- atadura: mão esquerda enrola a direita
		local leftCF, leftVis = nil, false
		if bandageT >= 0 then
			bandageT += dt
			local k = math.sin(math.clamp(bandageT / 1.3, 0, 1) * math.pi)
			pose = pose * CFrame.new(-0.55 * k, -0.25 * k, 0.3 * k) * CFrame.Angles(rad(10) * k, 0, rad(40) * k)
			local w = bandageT * 11
			leftCF = camera.CFrame * off * CFrame.new(-0.25 + math.cos(w) * 0.16, -1.0 + math.sin(w) * 0.1 - (1 - k) * 1.2, -2.25) * CFrame.Angles(rad(-15), rad(30), rad(75))
			leftVis = k > 0.1
			if bandageT >= 1.3 then bandageT = -1 end
		end
		local hands01 = (player:GetAttribute("Hands") or Config.HAND_MAX) / Config.HAND_MAX
		VMmod.apply(rig, camera.CFrame * off * pose, leftCF, leftVis, hands01)
	end
	lastCamCF = camera.CFrame

	-- ===== HUD =====
	local phase = Shared:GetAttribute("Phase") or "Intermission"
	local tl = Shared:GetAttribute("TimeLeft") or 0
	if phase == "Intermission" then
		hud.setClock("LOBBY  ·  PRÓXIMA NOITE", fmtTime(tl), nil)
	elseif phase == "Round" then
		local sub, col
		if Shared:GetAttribute("ExitsOpen") then sub, col = "SAÍDAS ABERTAS  —  FUJA", C.green
		else
			local left = math.max(0, Config.EXIT_UNLOCK_TIME - (Config.ROUND_TIME - tl))
			sub, col = "SAÍDAS ABREM EM " .. fmtTime(left), C.red
		end
		hud.setClock(K.upper(Shared:GetAttribute("MapName") or ""), fmtTime(tl), (survivor or monster or spectating) and sub or nil, col)
	else
		hud.setClock("FIM DA NOITE", "--:--", nil)
	end
	if not survivor then hud.setWounded(false, now) end
	if survivor then
		hud.setRoundMoney(player:GetAttribute("RoundMoney") or 0)
		hud.setStamina(stamina / maxStamina(), exhausted)
		local hands = player:GetAttribute("Hands") or Config.HAND_MAX
		hud.setHands(hands / Config.HAND_MAX)
		hud.setWounded(hands <= 0, now)
		hud.setBandages(player:GetAttribute("Bandages") or 0)
		hud.setFlashlight(hasLamp, battery, flashOn)
	elseif monster then
		hud.setStamina(stamina / maxStamina(), exhausted)
		hud.setAbility("Attack", false, math.max(0, 1.1 - (now - lastAttack)) / 1.1, nil)
		local sdef = myMonsterDef()
		hud.setSpecialName(sdef.ability.name)
		local sleft = math.max(0, specialCD - now)
		hud.setAbility("Special", false, sleft / sdef.ability.cooldown, sleft)
		for name, def in pairs(Config.MonsterAbilities) do
			local left = math.max(0, abilityCD[name] - now)
			hud.setAbility(name, not hasSkill(def.skill), left / def.cooldown, left)
		end
	end
	if now < hintUntil and not hiding() and K.inputMode() == "keyboard" then
		hud.hint.Text = survivor and "CLIQUE martelar   ·   SHIFT correr   ·   F atadura   ·   L lanterna   ·   E interagir"
			or (monster and "CLIQUE atacar   ·   R especial   ·   SHIFT correr   ·   Q C F talentos   ·   E abrir armário" or "")
	else
		hud.hint.Text = ""
	end
	if not Menu.open and not Menu.cursorMode() then UIS.MouseIconEnabled = false end

	-- alvo sob a mira
	local showT = false
	if survivor and not hiding() then
		local res = aimRay(Config.HAMMER_RANGE + 2)
		local m = res and findBreakable(res.Instance)
		if m and not brokenLocal[m] then
			local def = Config.Breakables[m:GetAttribute("Breakable")]
			if def then
				showT = true
				hud.setTarget(true, def.display, "$" .. def.value .. "   ·   " .. (def.hp <= 3 and "fácil" or def.hp <= 7 and "médio" or def.hp <= 12 and "difícil" or "muito difícil"), hpLocal[m] or 1)
			end
		end
	end
	if not showT then hud.setTarget(false) end
end)

print("[BLINDER] cliente iniciado")
