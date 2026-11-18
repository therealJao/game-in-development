--!strict
-- BLINDER :: configuração central do jogo
local Config = {}

-- Rodada
Config.INTERMISSION = 25          -- segundos no lobby antes da rodada
Config.STUDIO_INTERMISSION = 10   -- intervalo menor quando testando no Studio
Config.ROUND_TIME = 300           -- duração máxima da rodada
Config.EXIT_UNLOCK_TIME = 100     -- segundos até as portas de saída abrirem
Config.MIN_PLAYERS = 1
Config.PLAYER_MONSTER_MIN_PLAYERS = 3 -- com 3+ jogadores, um pode virar o monstro
Config.PLAYER_MONSTER_CHANCE = 0.5
Config.MONSTER_KILL_REWARD = 120

-- Movimento do sobrevivente
Config.WALK_SPEED = 12
Config.SPRINT_SPEED = 19
Config.STAMINA_MAX = 100
Config.STAMINA_DRAIN = 24
Config.STAMINA_REGEN = 13
Config.STAMINA_REGEN_DELAY = 1.1

-- Monstro (um pouco mais rápido que o sobrevivente correndo)
Config.MONSTER_WALK = 11
Config.MONSTER_INVESTIGATE = 16
Config.MONSTER_CHASE = 21.5
Config.MONSTER_KILL_RANGE = 6.0
Config.MONSTER_SENSE_RANGE = 16     -- percebe quem estiver perto, mesmo andando
Config.MONSTER_LOCKER_CHECK_RANGE = 22

-- Martelo / mãos
Config.HAMMER_COOLDOWN = 0.55
Config.HAMMER_RANGE = 10
Config.HAND_MAX = 100
Config.BLEED_DAMAGE = 12            -- dano por golpe quando as mãos estão destruídas
Config.BANDAGE_HEAL = 45
Config.BANDAGES_PER_MAP = 16

-- Ruído (raio em studs em que o monstro escuta)
Config.NOISE = {
	Walk = 12,
	Sprint = 55,
	Hit = 38,
	Break = 70,
	LockerFail = 45,
	Jump = 24,
}

-- Objetos quebráveis: hp = golpes base, value = dinheiro, handCost = dano nas mãos por golpe
Config.Breakables = {
	Vase   = { display = "Vaso",        hp = 2,  value = 15,  handCost = 4,  sound = "Glass", noise = 1.0 },
	Lamp   = { display = "Abajur",      hp = 2,  value = 20,  handCost = 4,  sound = "Glass", noise = 0.9 },
	Chair  = { display = "Cadeira",     hp = 4,  value = 35,  handCost = 6,  sound = "Wood",  noise = 1.0 },
	TV     = { display = "Televisão",   hp = 6,  value = 85,  handCost = 9,  sound = "Glass", noise = 1.3 },
	Piano  = { display = "Piano",       hp = 10, value = 170, handCost = 11, sound = "Wood",  noise = 1.5 },
	Statue = { display = "Estátua",     hp = 12, value = 210, handCost = 13, sound = "Metal", noise = 1.4 },
	Safe   = { display = "Cofre",       hp = 18, value = 380, handCost = 16, sound = "Metal", noise = 1.8 },
	-- Pizzaria
	Plush       = { display = "Pelúcia",          hp = 1,  value = 10,  handCost = 1,  sound = "Wood",  noise = 0.5 },
	Arcade      = { display = "Fliperama",        hp = 8,  value = 120, handCost = 10, sound = "Glass", noise = 1.4 },
	Oven        = { display = "Forno Industrial", hp = 12, value = 190, handCost = 13, sound = "Metal", noise = 1.6 },
	Animatronic = { display = "Animatrônico",     hp = 16, value = 320, handCost = 15, sound = "Metal", noise = 1.8 },
	-- Colégio
	Desk        = { display = "Carteira",         hp = 3,  value = 25,  handCost = 5,  sound = "Wood",  noise = 1.0 },
	Globe       = { display = "Globo",            hp = 2,  value = 22,  handCost = 3,  sound = "Glass", noise = 0.8 },
	Computer    = { display = "Computador",       hp = 5,  value = 75,  handCost = 8,  sound = "Glass", noise = 1.2 },
	Microscope  = { display = "Microscópio",      hp = 3,  value = 50,  handCost = 6,  sound = "Metal", noise = 1.0 },
	Trophy      = { display = "Troféu",           hp = 4,  value = 65,  handCost = 6,  sound = "Metal", noise = 1.1 },
	Vending     = { display = "Máquina de Lanche", hp = 14, value = 260, handCost = 14, sound = "Glass", noise = 1.7 },
}

-- Melhorias da loja (lobby)
Config.Upgrades = {
	{ id = "Stamina",    display = "Fôlego",       desc = "+12 de stamina máxima",            max = 10, baseCost = 150, growth = 1.45 },
	{ id = "Speed",      display = "Velocidade",   desc = "+0.6 de velocidade correndo",      max = 8,  baseCost = 220, growth = 1.55 },
	{ id = "Strength",   display = "Força",        desc = "+25% de dano do martelo",          max = 10, baseCost = 180, growth = 1.5  },
	{ id = "Resistance", display = "Resistência",  desc = "-7% de dano nas mãos por golpe",   max = 8,  baseCost = 200, growth = 1.5  },
	{ id = "Lungs",      display = "Pulmões",      desc = "Minigame do armário mais fácil",  max = 5,  baseCost = 300, growth = 1.7  },
}

-- ===================== LANTERNA DE CABEÇA =====================
-- Defina o preço aqui. Enquanto os dois forem nil, ela aparece ESCURA ("em breve") na loja.
--   price      = preço em dinheiro do jogo (ex: 4500)
--   gamePassId = ID de um Game Pass para vender por Robux (ex: 123456789)
Config.Flashlight = {
	name = "Lanterna de Cabeça",
	desc = "Ilumina tudo à sua frente. O Blinder é cego... então a luz não te entrega.",
	price = nil,
	gamePassId = nil,
	batteryDrain = 2.2,     -- % por segundo ligada
	batteryRecharge = 6,    -- % por segundo desligada
	rechargeDelay = 1.5,
	pickupsPerMap = 3,      -- quantas aparecem em cada mapa (valem só por 1 noite)
}

function Config.UpgradeCost(def, level: number): number
	return math.floor(def.baseCost * def.growth ^ level)
end

function Config.GetUpgrade(id: string)
	for _, u in ipairs(Config.Upgrades) do
		if u.id == id then return u end
	end
	return nil
end

-- ===================== Progressão =====================
Config.XP = {
	Escape = 60,          -- fugiu
	PerBreak = 4,         -- por objeto quebrado (se fugiu)
	Death = 15,           -- morreu (consolação)
	DeathPerBreak = 2,
	MonsterKill = 45,
	MonsterRound = 30,
	Parkour = 20,
}
function Config.XPForLevel(level: number): number
	return 100 + (level - 1) * 50
end
Config.SKILL_RESET_COST = 500
Config.START_SKILL_POINTS = 2   -- pontos iniciais (+1 por nível)

-- Árvores de habilidade. Cada árvore tem 3 ramos com 3 níveis (cada um exige o anterior).
Config.SkillTrees = {
	Survivor = {
		{ id = "S_Quiet",      branch = 1, tier = 1, cost = 1, name = "Passos Leves",       desc = "Andar faz 35% menos barulho." },
		{ id = "S_SilentRun",  branch = 1, tier = 2, cost = 2, name = "Corrida Silenciosa", desc = "Correr faz 25% menos barulho.", req = "S_Quiet" },
		{ id = "S_Shadow",     branch = 1, tier = 3, cost = 3, name = "Sombra",             desc = "Um erro a mais perdoado no minigame do armário.", req = "S_SilentRun" },
		{ id = "S_Grip",       branch = 2, tier = 1, cost = 1, name = "Pegada Firme",       desc = "+15% de dano do martelo." },
		{ id = "S_Calloused",  branch = 2, tier = 2, cost = 2, name = "Mãos Calejadas",     desc = "O primeiro golpe em cada objeto não machuca suas mãos.", req = "S_Grip" },
		{ id = "S_Demolisher", branch = 2, tier = 3, cost = 3, name = "Demolidor",          desc = "+20% de dinheiro por objeto quebrado.", req = "S_Calloused" },
		{ id = "S_Lungs",      branch = 3, tier = 1, cost = 1, name = "Fôlego Extra",       desc = "+20 de fôlego máximo." },
		{ id = "S_Adrenaline", branch = 3, tier = 2, cost = 2, name = "Adrenalina",         desc = "Quando o Blinder te persegue: +4 de velocidade por 3s (recarga 25s).", req = "S_Lungs" },
		{ id = "S_Medic",      branch = 3, tier = 3, cost = 3, name = "Primeiros Socorros", desc = "Começa a rodada com 1 atadura e elas curam 50% mais.", req = "S_Adrenaline" },
	},
	Monster = {
		{ id = "M_Stride",    branch = 1, tier = 1, cost = 1, name = "Passada Longa",  desc = "+1.5 de velocidade correndo." },
		{ id = "M_Lunge",     branch = 1, tier = 2, cost = 2, name = "Investida  [Q]", desc = "Arrancada brutal para frente (recarga 12s).", req = "M_Stride" },
		{ id = "M_Claws",     branch = 1, tier = 3, cost = 3, name = "Garras Longas",  desc = "+2 de alcance no ataque.", req = "M_Lunge" },
		{ id = "M_Ears",      branch = 2, tier = 1, cost = 1, name = "Ouvido Aguçado", desc = "Escuta ruídos 30% mais longe." },
		{ id = "M_Echo",      branch = 2, tier = 2, cost = 2, name = "Eco  [C]",       desc = "Revela sobreviventes a 60 studs por 2.5s (recarga 25s).", req = "M_Ears" },
		{ id = "M_Sniffer",   branch = 2, tier = 3, cost = 3, name = "Farejador",      desc = "Armários ocupados perto de você pulsam em vermelho.", req = "M_Echo" },
		{ id = "M_Presence",  branch = 3, tier = 1, cost = 1, name = "Presença",       desc = "Sobreviventes perto de você recuperam fôlego 50% mais devagar." },
		{ id = "M_Scream",    branch = 3, tier = 2, cost = 2, name = "Grito  [F]",     desc = "Atordoa os sobreviventes a 35 studs por 2s (recarga 30s).", req = "M_Presence" },
		{ id = "M_Nightmare", branch = 3, tier = 3, cost = 3, name = "Pesadelo",       desc = "As luzes morrem ao seu redor e a visão das vítimas distorce.", req = "M_Scream" },
	},
}
Config.SkillBranches = {
	Survivor = { "FURTIVIDADE", "FORÇA", "SOBREVIVÊNCIA" },
	Monster = { "CAÇADOR", "AUDIÇÃO", "TERROR" },
}
function Config.GetSkill(id: string)
	for _, tree in pairs(Config.SkillTrees) do
		for _, s in ipairs(tree) do if s.id == id then return s end end
	end
	return nil
end

Config.MonsterAbilities = {
	Lunge  = { skill = "M_Lunge",  key = Enum.KeyCode.Q, cooldown = 12, name = "Investida" },
	Echo   = { skill = "M_Echo",   key = Enum.KeyCode.C, cooldown = 25, name = "Eco" },
	Scream = { skill = "M_Scream", key = Enum.KeyCode.F, cooldown = 30, name = "Grito" },
}

-- ===================== TIPOS DE MONSTRO =====================
-- Cada monstro é comprado uma vez. Quanto mais caro, mais forte (mais "roubado").
-- Habilidade única de cada um fica na tecla [R]. Stats:
--   walk/chase = velocidades, kill = alcance do ataque, hear = multiplicador de audição, scale = tamanho
Config.Monsters = {
	{ id = "Blinder", name = "O Blinder", price = 0, tier = "Comum",
		desc = "A criatura original. Cego, alto e esquálido. Ouve tudo.",
		stats = { walk = 11, chase = 21.5, kill = 6.0, hear = 1.3, scale = 2.0 },
		ability = { id = "Scent", name = "Faro", cooldown = 30, desc = "Por 6s você ouve TODOS os sobreviventes do mapa, mesmo andando devagar." } },
	{ id = "Scarecrow", name = "O Espantalho", price = 6000, tier = "Incomum",
		desc = "Saco costurado na cabeça. Os corvos trabalham para ele.",
		stats = { walk = 11.5, chase = 22, kill = 6.2, hear = 1.4, scale = 2.05 },
		ability = { id = "Crows", name = "Revoada de Corvos", cooldown = 32, desc = "Corvos atacam quem estiver a 40 studs: fôlego zerado e 3s lentos." } },
	{ id = "Animatronic", name = "Urso Animatrônico", price = 15000, tier = "Raro",
		desc = "O mascote que nunca desliga. Controla a energia do lugar.",
		stats = { walk = 11.5, chase = 22.5, kill = 6.5, hear = 1.5, scale = 2.1 },
		ability = { id = "Blackout", name = "Apagão", cooldown = 40, desc = "Apaga TODAS as luzes e lanternas por 10s. Você fica mais rápido no escuro." } },
	{ id = "Doll", name = "Boneca de Porcelana", price = 35000, tier = "Épico",
		desc = "Rachada e silenciosa. Quando você a vê, já é tarde.",
		stats = { walk = 12, chase = 23, kill = 6.8, hear = 1.6, scale = 2.0 },
		ability = { id = "Silence", name = "Silêncio de Porcelana", cooldown = 35, desc = "Fica quase invisível e sem som por 7s. Ninguém sente você chegando." } },
	{ id = "Oni", name = "Oni Mascarado", price = 75000, tier = "Lendário",
		desc = "Demônio de máscara branca. Rasga tudo no caminho.",
		stats = { walk = 12.5, chase = 24, kill = 7.2, hear = 1.7, scale = 2.2 },
		ability = { id = "Rampage", name = "Investida Demoníaca", cooldown = 16, desc = "Arrancada brutal de 0.8s que mata qualquer um que encostar." } },
	{ id = "Shadow", name = "A Sombra", price = 150000, tier = "Mítico",
		desc = "Feita de escuridão. Aparece onde você fez barulho.",
		stats = { walk = 13, chase = 24.5, kill = 7.5, hear = 1.8, scale = 2.15 },
		ability = { id = "ShadowStep", name = "Passo Sombrio", cooldown = 40, desc = "Teleporta para trás do último sobrevivente que fez barulho." } },
}
-- ===== skins de martelo (só visual) =====
Config.HammerSkins = {
	{ id = "Default", name = "Martelo de Oficina", rarity = "Comum", price = 0, desc = "O velho de guerra. Cabo de madeira, cabeça de aço." },
	{ id = "Rune", name = "Martelo Rúnico", rarity = "Incomum", price = 2500, desc = "Pedra antiga com runas que brilham fraquinho." },
	{ id = "Candy", name = "Doce Pancada", rarity = "Raro", price = 6000, desc = "Listrado como bengala de doce. Cheira a hortelã." },
	{ id = "Toy", name = "Marreta Fofa", rarity = "Raro", price = 9000, desc = "Marreta de brinquedo gigante. Quebra tudo do mesmo jeito." },
	{ id = "Crystal", name = "Cristal Gélido", rarity = "Épico", price = 22000, desc = "Cabeça de cristal de gelo que reflete a lanterna." },
	{ id = "Gold", name = "Martelo Real", rarity = "Lendário", price = 50000, desc = "Ouro maciço com rubi. Puro exibicionismo." },
}
function Config.GetHammer(id: string)
	for _, h in ipairs(Config.HammerSkins) do if h.id == id then return h end end
	return nil
end

function Config.GetMonster(id: string)
	for _, m in ipairs(Config.Monsters) do if m.id == id then return m end end
	return Config.Monsters[1]
end

-- Skins de cada monstro (variações de material/cor). Só dá para comprar skin de monstro que você já tem.
--   style: "Original" (textura original), ou material + cor aplicados no corpo todo
Config.MonsterSkins = {
	{ id = "Original", name = "Original",   rarity = "Comum",    mult = 0,    style = { kind = "Original" } },
	{ id = "Blood",    name = "Sangrento",  rarity = "Incomum",  mult = 0.35, style = { kind = "Tint", color = Color3.fromRGB(120, 10, 14), material = Enum.Material.Slate } },
	{ id = "Albino",   name = "Albino",     rarity = "Raro",     mult = 0.6,  style = { kind = "Tint", color = Color3.fromRGB(232, 228, 220), material = Enum.Material.SmoothPlastic } },
	{ id = "Obsidian", name = "Obsidiana",  rarity = "Épico",    mult = 1.0,  style = { kind = "Tint", color = Color3.fromRGB(14, 12, 18), material = Enum.Material.Glass } },
	{ id = "Gold",     name = "Dourado",    rarity = "Lendário", mult = 1.6,  style = { kind = "Tint", color = Color3.fromRGB(214, 170, 60), material = Enum.Material.Foil } },
	{ id = "Ghost",    name = "Assombração", rarity = "Mítico",   mult = 2.4,  style = { kind = "Tint", color = Color3.fromRGB(150, 220, 255), material = Enum.Material.ForceField } },
}
function Config.SkinPrice(monster, skin): number
	local base = math.max(monster.price, 4000)
	return math.floor(base * skin.mult / 100 + 0.5) * 100
end
function Config.GetMonsterSkin(id: string)
	for _, s in ipairs(Config.MonsterSkins) do if s.id == id then return s end end
	return Config.MonsterSkins[1]
end

-- Skins de monstro (aparecem quando VOCÊ é o monstro)
Config.Skins = {
	{ id = "Blinder",     name = "O Blinder",          price = 0,    rarity = "Comum",    desc = "A criatura original. Venda nos olhos e boca rasgada." },
	{ id = "Scarecrow",   name = "Espantalho",         price = 2000, rarity = "Incomum",  desc = "Saco costurado na cabeça e palha saindo das juntas." },
	{ id = "Animatronic", name = "Urso Animatrônico",  price = 3000, rarity = "Raro",     desc = "Mascote de pizzaria abandonada, endoesqueleto exposto." },
	{ id = "Doll",        name = "Boneca de Porcelana", price = 3500, rarity = "Raro",     desc = "Rachada, alta demais, sorriso costurado." },
	{ id = "Oni",         name = "Oni Mascarado",      price = 5000, rarity = "Épico",    desc = "Demônio de máscara e chifres, inspirado em animes." },
	{ id = "Shadow",      name = "Sombra",             price = 8000, rarity = "Lendário", desc = "Quase invisível no escuro. Só os olhos brilham." },
}
Config.RarityColors = {
	Comum = Color3.fromRGB(170, 170, 170), Incomum = Color3.fromRGB(90, 200, 110), Raro = Color3.fromRGB(80, 150, 240),
	["Épico"] = Color3.fromRGB(170, 90, 240), ["Lendário"] = Color3.fromRGB(240, 180, 60), ["Mítico"] = Color3.fromRGB(240, 70, 90),
}
function Config.GetSkin(id: string)
	for _, s in ipairs(Config.Skins) do if s.id == id then return s end end
	return nil
end

-- Emotes (animações padrão do Roblox para R15)
Config.Emotes = {
	{ id = "Wave",   name = "Acenar",    price = 0,    anim = "rbxassetid://507770239" },
	{ id = "Point",  name = "Apontar",   price = 150,  anim = "rbxassetid://507770453" },
	{ id = "Cheer",  name = "Comemorar", price = 300,  anim = "rbxassetid://507770677" },
	{ id = "Laugh",  name = "Gargalhar", price = 300,  anim = "rbxassetid://507770818" },
	{ id = "Dance1", name = "Dança I",   price = 600,  anim = "rbxassetid://507771019" },
	{ id = "Dance2", name = "Dança II",  price = 900,  anim = "rbxassetid://507776043" },
	{ id = "Dance3", name = "Dança III", price = 1200, anim = "rbxassetid://507777268" },
}
function Config.GetEmote(id: string)
	for _, e in ipairs(Config.Emotes) do if e.id == id then return e end end
	return nil
end

-- Sons (Creator Store, gratuitos)
Config.Sounds = {
	Scream      = "rbxassetid://103702724347967",
	MonsterRun  = "rbxassetid://6818333582",
	Growl       = "rbxassetid://9112863325",
	Heartbeat   = "rbxassetid://6202853067",
	Ambience    = "rbxassetid://92277043831284",
	Chase       = "rbxassetid://71374905925238",
	Jumpscare   = "rbxassetid://132287165710104",
	Glass       = "rbxassetid://128763165071133",
	Wood        = "rbxassetid://9120801590",
	Metal       = "rbxassetid://9116523283",
	Locker      = "rbxassetid://9116742347",
	MusicBox    = "rbxassetid://1842361805",   -- música calma do lobby (violão)
	Night       = "rbxassetid://7235496983",   -- ambiente de lago / natureza
	Click       = "rbxassetid://9065073444",
}

return Config
