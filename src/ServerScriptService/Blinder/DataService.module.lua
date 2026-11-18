-- BLINDER :: persistência de dados do jogador
local DSS = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local Config = require(RS.Blinder.Config)

local Data = {}
local cache: { [Player]: any } = {}
local store
pcall(function() store = DSS:GetDataStore("BlinderData_v1") end)

local function default()
	return {
		Money = 0, Upgrades = {}, Escapes = 0, Kills = 0, Deaths = 0, Broken = 0, Rounds = 0,
		XP = 0, Level = 1, Skills = {},
		Skins = { Blinder = true }, EquippedSkin = "Blinder",
		Emotes = { Wave = true },
		Flashlight = false,
		Monsters = { Blinder = true }, EquippedMonster = "Blinder",
		MonsterSkins = { Blinder = { Original = true } }, EquippedMonsterSkin = { Blinder = "Original" },
		Hammers = { Default = true }, EquippedHammer = "Default",
	}
end

local function spentPoints(d): number
	local n = 0
	for id in pairs(d.Skills) do
		local s = Config.GetSkill(id)
		if s then n += s.cost end
	end
	return n
end

local function skillPoints(d): number
	return Config.START_SKILL_POINTS + (d.Level - 1) - spentPoints(d)
end

function Data.SyncAttrs(plr: Player)
	local d = cache[plr]; if not d then return end
	plr:SetAttribute("Money", d.Money)
	plr:SetAttribute("Escapes", d.Escapes)
	plr:SetAttribute("Kills", d.Kills)
	plr:SetAttribute("Deaths", d.Deaths)
	plr:SetAttribute("Broken", d.Broken)
	plr:SetAttribute("Rounds", d.Rounds)
	plr:SetAttribute("Level", d.Level)
	plr:SetAttribute("XP", d.XP)
	plr:SetAttribute("XPNeed", Config.XPForLevel(d.Level))
	plr:SetAttribute("SkillPoints", skillPoints(d))
	plr:SetAttribute("EquippedSkin", d.EquippedSkin)
	plr:SetAttribute("OwnsFlashlight", d.Flashlight == true or plr:GetAttribute("FlashlightPass") == true)
	for _, u in ipairs(Config.Upgrades) do
		plr:SetAttribute("Up_" .. u.id, d.Upgrades[u.id] or 0)
	end
	for _, tree in pairs(Config.SkillTrees) do
		for _, s in ipairs(tree) do plr:SetAttribute("Sk_" .. s.id, d.Skills[s.id] == true) end
	end
	for _, s in ipairs(Config.Skins) do plr:SetAttribute("Skin_" .. s.id, d.Skins[s.id] == true) end
	for _, e in ipairs(Config.Emotes) do plr:SetAttribute("Emote_" .. e.id, d.Emotes[e.id] == true) end
	plr:SetAttribute("EquippedMonster", d.EquippedMonster)
	plr:SetAttribute("HammerSkin", d.EquippedHammer or "Default")
	for _, h in ipairs(Config.HammerSkins) do plr:SetAttribute("Ham_" .. h.id, d.Hammers[h.id] == true) end
	for _, m in ipairs(Config.Monsters) do
		plr:SetAttribute("Mon_" .. m.id, d.Monsters[m.id] == true)
		plr:SetAttribute("MSkinEq_" .. m.id, (d.EquippedMonsterSkin[m.id]) or "Original")
		for _, s in ipairs(Config.MonsterSkins) do
			plr:SetAttribute("MSkin_" .. m.id .. "_" .. s.id, (d.MonsterSkins[m.id] and d.MonsterSkins[m.id][s.id]) == true)
		end
	end
	local ls = plr:FindFirstChild("leaderstats")
	if ls then
		ls.Dinheiro.Value = d.Money
		ls.Fugas.Value = d.Escapes
	end
end

function Data.Load(plr: Player)
	local d
	if store then
		local ok, res = pcall(function() return store:GetAsync("p_" .. plr.UserId) end)
		if ok and type(res) == "table" then d = res end
	end
	d = d or default()
	for k, v in pairs(default()) do if d[k] == nil then d[k] = v end end
	d.Skins.Blinder = true
	d.Emotes.Wave = true
	-- migração: skins antigas viram monstros
	for id in pairs(d.Skins) do d.Monsters[id] = true end
	d.Monsters.Blinder = true
	for id in pairs(d.Monsters) do
		d.MonsterSkins[id] = d.MonsterSkins[id] or {}
		d.MonsterSkins[id].Original = true
		d.EquippedMonsterSkin[id] = d.EquippedMonsterSkin[id] or "Original"
	end
	if not d.Monsters[d.EquippedMonster] then d.EquippedMonster = "Blinder" end
	d.Hammers.Default = true
	if not d.Hammers[d.EquippedHammer] then d.EquippedHammer = "Default" end
	cache[plr] = d
	local ls = Instance.new("Folder"); ls.Name = "leaderstats"
	local m = Instance.new("IntValue"); m.Name = "Dinheiro"; m.Parent = ls
	local e = Instance.new("IntValue"); e.Name = "Fugas"; e.Parent = ls
	ls.Parent = plr
	Data.SyncAttrs(plr)
	return d
end

function Data.Get(plr: Player) return cache[plr] end

function Data.Upgrade(plr: Player, id: string): number
	local d = cache[plr]; if not d then return 0 end
	return d.Upgrades[id] or 0
end

function Data.AddMoney(plr: Player, n: number)
	local d = cache[plr]; if not d then return end
	d.Money = math.max(0, d.Money + math.floor(n))
	Data.SyncAttrs(plr)
end

function Data.Inc(plr: Player, key: string, n: number?)
	local d = cache[plr]; if not d then return end
	d[key] = (d[key] or 0) + (n or 1)
	Data.SyncAttrs(plr)
end

function Data.BuyUpgrade(plr: Player, id: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local def = Config.GetUpgrade(id); if not def then return false, "Melhoria inválida" end
	local lvl = d.Upgrades[id] or 0
	if lvl >= def.max then return false, "Nível máximo" end
	local cost = Config.UpgradeCost(def, lvl)
	if d.Money < cost then return false, "Dinheiro insuficiente" end
	d.Money -= cost
	d.Upgrades[id] = lvl + 1
	Data.SyncAttrs(plr)
	return true, def.display .. " → nível " .. (lvl + 1)
end

-- compra (ou equipa, se já tiver) um tipo de monstro
function Data.BuyMonster(plr: Player, id: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local def
	for _, m in ipairs(Config.Monsters) do if m.id == id then def = m end end
	if not def then return false, "Monstro inválido" end
	if d.Monsters[id] then
		d.EquippedMonster = id
		Data.SyncAttrs(plr)
		return true, def.name .. " equipado"
	end
	if d.Money < def.price then return false, "Dinheiro insuficiente" end
	d.Money -= def.price
	d.Monsters[id] = true
	d.MonsterSkins[id] = d.MonsterSkins[id] or { Original = true }
	d.EquippedMonsterSkin[id] = d.EquippedMonsterSkin[id] or "Original"
	d.EquippedMonster = id
	Data.SyncAttrs(plr)
	return true, def.name .. " é seu!"
end

function Data.BuyMonsterSkin(plr: Player, monsterId: string, skinId: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	if not d.Monsters[monsterId] then return false, "Compre o monstro primeiro" end
	local mon = Config.GetMonster(monsterId)
	local skin
	for _, s in ipairs(Config.MonsterSkins) do if s.id == skinId then skin = s end end
	if not skin or not mon then return false, "Skin inválida" end
	d.MonsterSkins[monsterId] = d.MonsterSkins[monsterId] or { Original = true }
	if d.MonsterSkins[monsterId][skinId] then
		d.EquippedMonsterSkin[monsterId] = skinId
		Data.SyncAttrs(plr)
		return true, skin.name .. " equipada"
	end
	local price = Config.SkinPrice(mon, skin)
	if d.Money < price then return false, "Dinheiro insuficiente" end
	d.Money -= price
	d.MonsterSkins[monsterId][skinId] = true
	d.EquippedMonsterSkin[monsterId] = skinId
	Data.SyncAttrs(plr)
	return true, mon.name .. " · " .. skin.name .. " comprada!"
end

-- compra (ou equipa) uma skin de martelo
function Data.BuyHammer(plr: Player, id: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local def = Config.GetHammer(id); if not def then return false, "Martelo inválido" end
	if d.Hammers[id] then
		d.EquippedHammer = id
		Data.SyncAttrs(plr)
		return true, def.name .. " equipado"
	end
	if d.Money < def.price then return false, "Dinheiro insuficiente" end
	d.Money -= def.price
	d.Hammers[id] = true
	d.EquippedHammer = id
	Data.SyncAttrs(plr)
	return true, def.name .. " é seu!"
end

function Data.MonsterLoadout(plr: Player): (string, string)
	local d = cache[plr]
	if not d then return "Blinder", "Original" end
	local id = d.EquippedMonster or "Blinder"
	return id, (d.EquippedMonsterSkin[id] or "Original")
end

function Data.GiveFlashlight(plr: Player)
	local d = cache[plr]; if not d then return end
	d.Flashlight = true
	Data.SyncAttrs(plr)
end

function Data.BuyFlashlight(plr: Player): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local price = Config.Flashlight.price
	if d.Flashlight or plr:GetAttribute("FlashlightPass") then return false, "Você já tem a lanterna" end
	if not price then return false, "A lanterna ainda não está à venda" end
	if d.Money < price then return false, "Dinheiro insuficiente" end
	d.Money -= price
	d.Flashlight = true
	Data.SyncAttrs(plr)
	return true, "Lanterna de Cabeça é sua para sempre!"
end

function Data.HasSkill(plr: Player, id: string): boolean
	local d = cache[plr]
	return d ~= nil and d.Skills[id] == true
end

-- XP com subida de nível; retorna quantos níveis subiu
function Data.AddXP(plr: Player, amount: number): number
	local d = cache[plr]; if not d then return 0 end
	d.XP += math.floor(amount)
	local ups = 0
	while d.XP >= Config.XPForLevel(d.Level) do
		d.XP -= Config.XPForLevel(d.Level)
		d.Level += 1
		ups += 1
	end
	Data.SyncAttrs(plr)
	return ups
end

function Data.UnlockSkill(plr: Player, id: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local s = Config.GetSkill(id); if not s then return false, "Habilidade inválida" end
	if d.Skills[id] then return false, "Você já tem essa habilidade" end
	if s.req and not d.Skills[s.req] then return false, "Desbloqueie a habilidade anterior primeiro" end
	if skillPoints(d) < s.cost then return false, "Pontos de habilidade insuficientes" end
	d.Skills[id] = true
	Data.SyncAttrs(plr)
	return true, s.name .. " desbloqueada!"
end

function Data.ResetSkills(plr: Player, tree: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local list = Config.SkillTrees[tree]; if not list then return false, "Árvore inválida" end
	local any = false
	for _, s in ipairs(list) do if d.Skills[s.id] then any = true end end
	if not any then return false, "Nada para resetar" end
	if d.Money < Config.SKILL_RESET_COST then return false, "Precisa de $" .. Config.SKILL_RESET_COST end
	d.Money -= Config.SKILL_RESET_COST
	for _, s in ipairs(list) do d.Skills[s.id] = nil end
	Data.SyncAttrs(plr)
	return true, "Pontos devolvidos!"
end

function Data.BuySkin(plr: Player, id: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local s = Config.GetSkin(id); if not s then return false, "Skin inválida" end
	if d.Skins[id] then
		d.EquippedSkin = id
		Data.SyncAttrs(plr)
		return true, s.name .. " equipada"
	end
	if d.Money < s.price then return false, "Dinheiro insuficiente" end
	d.Money -= s.price
	d.Skins[id] = true
	d.EquippedSkin = id
	Data.SyncAttrs(plr)
	return true, s.name .. " comprada e equipada!"
end

function Data.BuyEmote(plr: Player, id: string): (boolean, string)
	local d = cache[plr]; if not d then return false, "Dados não carregados" end
	local e = Config.GetEmote(id); if not e then return false, "Emote inválido" end
	if d.Emotes[id] then return true, "" end
	if d.Money < e.price then return false, "Dinheiro insuficiente" end
	d.Money -= e.price
	d.Emotes[id] = true
	Data.SyncAttrs(plr)
	return true, e.name .. " desbloqueado!"
end

function Data.Save(plr: Player)
	local d = cache[plr]; if not d or not store then return end
	pcall(function() store:SetAsync("p_" .. plr.UserId, d) end)
end

Players.PlayerRemoving:Connect(function(plr)
	Data.Save(plr)
	cache[plr] = nil
end)

game:BindToClose(function()
	for _, p in ipairs(Players:GetPlayers()) do Data.Save(p) end
end)

task.spawn(function()
	while true do
		task.wait(120)
		for _, p in ipairs(Players:GetPlayers()) do Data.Save(p) end
	end
end)

return Data
