-- BLINDER :: fábrica do monstro e de todas as skins
-- Todas as skins usam o mesmo esqueleto (Motor6Ds com os mesmos nomes), então a
-- animação procedural (MonsterAnimator) funciona igual para todas.
local RS = game:GetService("ReplicatedStorage")
local Config = require(RS.Blinder.Config)
local Rigs = require(RS.Blinder.MonsterRigs)
local F = {}

local EYES = {
	Blinder = Color3.fromRGB(255, 40, 30), Scarecrow = Color3.fromRGB(255, 140, 40), Animatronic = Color3.fromRGB(235, 240, 255),
	Doll = Color3.fromRGB(255, 50, 60), Oni = Color3.fromRGB(255, 200, 60), Shadow = Color3.fromRGB(200, 225, 255),
}

-- brilho dos olhos / boca (luz na cabeça)
function F.AddEyes(model: Model, typeId: string)
	local head = model:FindFirstChild("Head")
	if not head then return end
	local l = Instance.new("PointLight"); l.Name = "EyeGlow"; l.Color = EYES[typeId] or EYES.Blinder; l.Range = 10; l.Brightness = 1.6; l.Shadows = false; l.Parent = head
end

-- monstro de malha 3D (novo). Retorna nil se o modelo não existir
function F.CreateRigged(typeId: string, skinId: string?): Model?
	local m = Rigs.Clone(typeId, skinId, false)
	if not m then return nil end
	local hum = m:FindFirstChildOfClass("Humanoid")
	hum.MaxHealth = math.huge; hum.Health = math.huge
	hum.WalkSpeed = Config.MONSTER_WALK
	m:SetAttribute("IsMonster", true)
	m:SetAttribute("Skin", skinId or "Original")
	m:SetAttribute("MonsterType", typeId)
	F.AddEyes(m, typeId)
	F.AddSounds(m.PrimaryPart)
	return m
end

-- IA: usa um dos modelos novos (tipo aleatório por noite), com fallback para o antigo
function F.CreateAI(typeId: string?, skinId: string?): Model
	if not typeId then
		local pool = {}
		local folder = RS.Blinder:FindFirstChild("MonsterRigs")
		if folder then for _, c in ipairs(folder:GetChildren()) do table.insert(pool, c.Name) end end
		typeId = (#pool > 0) and pool[math.random(#pool)] or "Blinder"
	end
	local m = F.CreateRigged(typeId, skinId)
	if m then m.Name = "Blinder"; return m end
	return F.CreateAIOld(skinId)
end

local SKINS = {
	Blinder     = { skin = Color3.fromRGB(38, 34, 36),   mat = Enum.Material.Slate,         glow = Color3.fromRGB(255, 40, 30) },
	Scarecrow   = { skin = Color3.fromRGB(150, 118, 72), mat = Enum.Material.Fabric,        glow = Color3.fromRGB(255, 140, 40) },
	Animatronic = { skin = Color3.fromRGB(104, 66, 38),  mat = Enum.Material.Fabric,        glow = Color3.fromRGB(255, 255, 255) },
	Doll        = { skin = Color3.fromRGB(232, 224, 214), mat = Enum.Material.SmoothPlastic, glow = Color3.fromRGB(255, 60, 60) },
	Oni         = { skin = Color3.fromRGB(110, 18, 20),  mat = Enum.Material.Slate,         glow = Color3.fromRGB(255, 200, 40) },
	Shadow      = { skin = Color3.fromRGB(6, 6, 8),      mat = Enum.Material.SmoothPlastic, glow = Color3.fromRGB(220, 230, 255) },
}
F.Skins = SKINS

local rad = math.rad
local CF = CFrame.new
local ANG = CFrame.Angles

local function part(parent, name, size, color, mat, shape)
	local p = Instance.new("Part")
	p.Name = name; p.Size = size; p.Color = color; p.Material = mat or Enum.Material.SmoothPlastic
	p.CanCollide = false; p.CanQuery = false; p.CanTouch = false; p.Massless = true
	p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
	if shape then p.Shape = shape end
	p.Parent = parent
	return p
end

local function motor(name, p0, p1, c0, c1)
	local m = Instance.new("Motor6D")
	m.Name = name; m.Part0 = p0; m.Part1 = p1; m.C0 = c0; m.C1 = c1 or CFrame.new()
	m.Parent = p0
	return m
end

local function weld(p0, p1, c0)
	local w = Instance.new("Weld"); w.Part0 = p0; w.Part1 = p1; w.C0 = c0; w.Parent = p1
	return p1
end

-- peça decorativa soldada em `to`
local function deco(model, to, name, size, color, mat, c0, shape)
	return weld(to, part(model, name, size, color, mat, shape), c0)
end

local function light(parent, color, range, bright)
	local l = Instance.new("PointLight"); l.Color = color; l.Range = range or 6; l.Brightness = bright or 2; l.Parent = parent
	return l
end

local function claws(model, hand, color, len, count)
	count = count or 3
	for f = 1, count do
		local x = (f - (count + 1) / 2) * 0.2
		deco(model, hand, "Claw", Vector3.new(0.09, len, 0.09), color, Enum.Material.SmoothPlastic,
			CF(x, -0.3 - len / 2, -0.05) * ANG(rad(-10), 0, x * 0.4))
	end
end

local function teeth(model, head, y, z, color, n, size)
	for i = 1, n do
		local x = (i - (n + 1) / 2) * (size or 0.19)
		deco(model, head, "Tooth", Vector3.new(0.12, 0.22, 0.1), color, Enum.Material.SmoothPlastic, CF(x, y, z) * ANG(0, 0, 0), Enum.PartType.Wedge)
		deco(model, head, "Tooth", Vector3.new(0.12, 0.22, 0.1), color, Enum.Material.SmoothPlastic, CF(x, y - 0.42, z) * ANG(0, 0, rad(180)), Enum.PartType.Wedge)
	end
end

-- ===================== decorações por skin =====================
local DECOR = {}

DECOR.Blinder = function(model, P, s)
	for i = 0, 3 do deco(model, P.torso, "Rib", Vector3.new(1.9, 0.14, 0.12), Color3.fromRGB(70, 64, 66), s.mat, CF(0, 0.9 - i * 0.42, -0.56)) end
	deco(model, P.torso, "Spine", Vector3.new(0.3, 3.2, 0.25), Color3.fromRGB(60, 54, 56), s.mat, CF(0, 0, 0.6))
	local cloth = Color3.fromRGB(110, 18, 18)
	deco(model, P.head, "Blindfold", Vector3.new(0.45, 1.62, 1.62), cloth, Enum.Material.Fabric, CF(0, 0.25, 0) * ANG(0, 0, rad(90)), Enum.PartType.Cylinder)
	for _, side in ipairs({ -1, 1 }) do
		deco(model, P.head, "BandTail", Vector3.new(0.15, 0.3, 1.1), cloth, Enum.Material.Fabric, CF(side * 0.15, 0.15, 1.0) * ANG(rad(-35), side * rad(15), 0))
		deco(model, P.head, "Blood", Vector3.new(0.1, 0.55, 0.05), Color3.fromRGB(90, 0, 0), Enum.Material.Glass, CF(side * 0.35, -0.15, -0.72))
	end
	local mouth = deco(model, P.head, "Mouth", Vector3.new(1.0, 0.55, 0.2), Color3.fromRGB(8, 0, 0), nil, CF(0, -0.45, -0.66))
	teeth(model, P.head, -0.24, -0.74, Color3.fromRGB(225, 215, 190), 5)
	light(mouth, s.glow, 6, 2)
	claws(model, P.LHand, Color3.fromRGB(20, 18, 16), 1.3)
	claws(model, P.RHand, Color3.fromRGB(20, 18, 16), 1.3)
end

DECOR.Scarecrow = function(model, P, s)
	local black = Color3.fromRGB(15, 12, 10)
	local straw = Color3.fromRGB(215, 180, 90)
	P.head.Color = Color3.fromRGB(170, 140, 90)
	-- olhos em X costurados
	for _, side in ipairs({ -1, 1 }) do
		for _, r in ipairs({ 45, -45 }) do
			deco(model, P.head, "Stitch", Vector3.new(0.45, 0.08, 0.06), black, Enum.Material.Fabric, CF(side * 0.35, 0.25, -0.72) * ANG(0, 0, rad(r)))
		end
	end
	-- boca costurada
	deco(model, P.head, "Seam", Vector3.new(1.0, 0.07, 0.06), black, Enum.Material.Fabric, CF(0, -0.35, -0.7))
	for i = -2, 2 do deco(model, P.head, "Stitch", Vector3.new(0.05, 0.25, 0.06), black, Enum.Material.Fabric, CF(i * 0.2, -0.35, -0.72)) end
	local ember = deco(model, P.head, "Ember", Vector3.new(0.3, 0.1, 0.05), s.glow, Enum.Material.Neon, CF(0, -0.35, -0.69))
	light(ember, s.glow, 5, 1.5)
	-- chapéu
	local hatC = Color3.fromRGB(70, 50, 30)
	deco(model, P.head, "HatBrim", Vector3.new(0.15, 3.2, 3.2), hatC, Enum.Material.Fabric, CF(0, 0.75, 0) * ANG(0, 0, rad(90)) * ANG(rad(8), 0, 0), Enum.PartType.Cylinder)
	deco(model, P.head, "HatTop", Vector3.new(1.1, 1.5, 1.5), hatC, Enum.Material.Fabric, CF(0, 1.3, 0.05) * ANG(0, 0, rad(90)), Enum.PartType.Cylinder)
	deco(model, P.head, "HatBand", Vector3.new(0.25, 1.55, 1.55), Color3.fromRGB(120, 20, 20), Enum.Material.Fabric, CF(0, 0.95, 0.05) * ANG(0, 0, rad(90)), Enum.PartType.Cylinder)
	-- camisa xadrez com remendos
	P.torso.Color = Color3.fromRGB(110, 35, 30); P.torso.Material = Enum.Material.Fabric
	deco(model, P.torso, "Patch", Vector3.new(0.7, 0.7, 0.05), Color3.fromRGB(60, 70, 110), Enum.Material.Fabric, CF(0.4, 0.5, -0.57) * ANG(0, 0, rad(12)))
	deco(model, P.torso, "Patch", Vector3.new(0.6, 0.5, 0.05), Color3.fromRGB(150, 130, 80), Enum.Material.Fabric, CF(-0.5, -0.6, -0.57) * ANG(0, 0, rad(-8)))
	deco(model, P.torso, "Rope", Vector3.new(0.3, 0.9, 0.9), Color3.fromRGB(120, 100, 60), Enum.Material.Fabric, CF(0, 1.85, -0.1) * ANG(0, 0, rad(90)), Enum.PartType.Cylinder)
	-- palha saindo das juntas
	local function tuft(to, c0, n)
		for i = 1, n do
			local a = (i / n) * math.pi * 2
			deco(model, to, "Straw", Vector3.new(0.05, 0.7, 0.05), straw, Enum.Material.Fabric, c0 * ANG(math.cos(a) * 0.9, 0, math.sin(a) * 0.9) * CF(0, -0.3, 0))
		end
	end
	tuft(P.torso, CF(0, 1.8, 0), 7)
	tuft(P.LLowerArm, CF(0, -1.5, 0), 4)
	tuft(P.RLowerArm, CF(0, -1.5, 0), 4)
	tuft(P.LShin, CF(0, -1.2, 0), 4)
	tuft(P.RShin, CF(0, -1.2, 0), 4)
	-- foice na mão direita
	deco(model, P.RHand, "SickleHandle", Vector3.new(0.2, 1.6, 0.2), Color3.fromRGB(90, 60, 35), Enum.Material.Wood, CF(0, -0.8, -0.2))
	for i = 0, 5 do
		local a = rad(i * 28)
		deco(model, P.RHand, "Blade", Vector3.new(0.08, 0.5, 0.18), Color3.fromRGB(150, 150, 155), Enum.Material.Metal,
			CF(0, -1.6, -0.2) * ANG(0, 0, 0) * CF(0, -math.sin(a) * 0.9, -math.cos(a) * 0.9 + 0.9) * ANG(-a, 0, 0))
	end
	claws(model, P.LHand, straw, 0.9, 4)
end

DECOR.Animatronic = function(model, P, s)
	local fur, tan = s.skin, Color3.fromRGB(170, 130, 85)
	local metal, dark = Color3.fromRGB(130, 130, 135), Color3.fromRGB(10, 10, 10)
	-- orelhas
	for _, side in ipairs({ -1, 1 }) do
		deco(model, P.head, "Ear", Vector3.new(0.7, 0.7, 0.35), fur, s.mat, CF(side * 0.62, 0.78, 0.05), Enum.PartType.Ball)
		deco(model, P.head, "EarIn", Vector3.new(0.4, 0.4, 0.2), tan, s.mat, CF(side * 0.62, 0.78, -0.08), Enum.PartType.Ball)
		-- olhos: buracos escuros com pupilas brilhantes
		deco(model, P.head, "Socket", Vector3.new(0.42, 0.42, 0.2), dark, nil, CF(side * 0.33, 0.22, -0.62), Enum.PartType.Ball)
		local pupil = deco(model, P.head, "Pupil", Vector3.new(0.1, 0.1, 0.06), Color3.new(1, 1, 1), Enum.Material.Neon, CF(side * 0.33, 0.22, -0.73), Enum.PartType.Ball)
		if side == 1 then light(pupil, s.glow, 5, 1.2) end
	end
	-- focinho, nariz, mandíbula metálica
	deco(model, P.head, "Muzzle", Vector3.new(0.9, 0.55, 0.55), tan, s.mat, CF(0, -0.22, -0.6), Enum.PartType.Ball)
	deco(model, P.head, "Nose", Vector3.new(0.3, 0.2, 0.15), dark, nil, CF(0, -0.05, -0.88), Enum.PartType.Ball)
	local jaw = deco(model, P.head, "Jaw", Vector3.new(0.85, 0.2, 0.6), metal, Enum.Material.Metal, CF(0, -0.75, -0.45) * ANG(rad(18), 0, 0))
	for i = -2, 2 do deco(model, jaw, "MetalTooth", Vector3.new(0.1, 0.18, 0.08), Color3.fromRGB(200, 200, 200), Enum.Material.Metal, CF(i * 0.16, 0.18, -0.22), Enum.PartType.Wedge) end
	-- cartola e gravata borboleta
	deco(model, P.head, "HatBrim", Vector3.new(0.08, 1.1, 1.1), dark, nil, CF(0.1, 0.92, 0) * ANG(0, 0, rad(90)) * ANG(0, 0, rad(-8)), Enum.PartType.Cylinder)
	deco(model, P.head, "HatTop", Vector3.new(0.75, 0.75, 0.75), dark, nil, CF(0.13, 1.3, 0) * ANG(0, 0, rad(90)), Enum.PartType.Cylinder)
	for _, side in ipairs({ -1, 1 }) do
		deco(model, P.torso, "Bow", Vector3.new(0.35, 0.3, 0.2), dark, nil, CF(side * 0.2, 1.45, -0.6) * ANG(0, 0, rad(side * 90)), Enum.PartType.Wedge)
	end
	-- barriga
	deco(model, P.torso, "Belly", Vector3.new(1.5, 1.8, 0.1), tan, s.mat, CF(0, -0.3, -0.56))
	-- endoesqueleto exposto (fantasia rasgada)
	P.LLowerArm.Color = metal; P.LLowerArm.Material = Enum.Material.Metal
	P.RShin.Color = metal; P.RShin.Material = Enum.Material.Metal
	for _, j in ipairs({ { P.LUpperArm, -1.45 }, { P.RUpperArm, -1.45 }, { P.LThigh, -1.2 }, { P.RThigh, -1.2 } }) do
		deco(model, j[1], "Joint", Vector3.new(0.55, 0.55, 0.55), metal, Enum.Material.Metal, CF(0, j[2], 0), Enum.PartType.Ball)
	end
	for _, side in ipairs({ P.LHand, P.RHand }) do claws(model, side, metal, 0.8, 4) end
	-- fios soltos
	deco(model, P.LLowerArm, "Wire", Vector3.new(0.05, 0.8, 0.05), Color3.fromRGB(200, 40, 40), nil, CF(0.2, 0.5, -0.1) * ANG(0, 0, rad(30)))
	deco(model, P.RShin, "Wire", Vector3.new(0.05, 0.7, 0.05), Color3.fromRGB(40, 80, 200), nil, CF(-0.2, 0.3, -0.1) * ANG(0, 0, rad(-25)))
end

DECOR.Doll = function(model, P, s)
	local black, red = Color3.fromRGB(12, 10, 10), Color3.fromRGB(140, 15, 25)
	local crack = Color3.fromRGB(60, 50, 50)
	-- rachaduras
	for i = 1, 5 do
		deco(model, P.head, "Crack", Vector3.new(0.04, 0.5 + math.random() * 0.4, 0.04), crack, nil,
			CF((math.random() - 0.5) * 0.9, (math.random() - 0.5) * 0.8, -0.72) * ANG(0, 0, rad(math.random(-60, 60))))
	end
	for i = 1, 4 do
		deco(model, P.torso, "Crack", Vector3.new(0.05, 0.8, 0.05), crack, nil, CF((math.random() - 0.5) * 1.6, (math.random() - 0.5) * 2.5, -0.57) * ANG(0, 0, rad(math.random(-50, 50))))
	end
	-- olhos ocos
	for _, side in ipairs({ -1, 1 }) do
		deco(model, P.head, "Socket", Vector3.new(0.4, 0.45, 0.2), black, nil, CF(side * 0.34, 0.2, -0.63), Enum.PartType.Ball)
		deco(model, P.head, "Pupil", Vector3.new(0.08, 0.08, 0.05), Color3.new(1, 1, 1), Enum.Material.Neon, CF(side * 0.34, 0.2, -0.74), Enum.PartType.Ball)
		deco(model, P.head, "Tear", Vector3.new(0.06, 0.45, 0.04), Color3.fromRGB(20, 20, 20), nil, CF(side * 0.34, -0.1, -0.72))
	end
	-- sorriso costurado
	for i = -3, 3 do
		local y = -0.42 + (i * i) * 0.012
		deco(model, P.head, "Smile", Vector3.new(0.17, 0.05, 0.05), red, nil, CF(i * 0.15, y, -0.72) * ANG(0, 0, rad(i * 6)))
		deco(model, P.head, "Stitch", Vector3.new(0.03, 0.16, 0.05), black, nil, CF(i * 0.15, y, -0.73))
	end
	-- cabelo
	deco(model, P.head, "HairBack", Vector3.new(1.7, 2.3, 0.6), black, Enum.Material.Fabric, CF(0, -0.3, 0.5))
	deco(model, P.head, "HairTop", Vector3.new(1.65, 0.5, 1.6), black, Enum.Material.Fabric, CF(0, 0.72, 0.02))
	deco(model, P.head, "Bangs", Vector3.new(1.4, 0.35, 0.2), black, Enum.Material.Fabric, CF(0, 0.55, -0.66))
	for _, side in ipairs({ -1, 1 }) do
		deco(model, P.head, "Strand", Vector3.new(0.25, 2.4, 0.35), black, Enum.Material.Fabric, CF(side * 0.78, -0.6, -0.1))
		deco(model, P.head, "Bow", Vector3.new(0.4, 0.35, 0.15), red, Enum.Material.Fabric, CF(side * 0.25 + 0.35, 0.85, -0.2) * ANG(0, 0, rad(side * 90)), Enum.PartType.Wedge)
	end
	-- vestido
	deco(model, P.pelvis, "Dress", Vector3.new(2.7, 1.9, 1.8), red, Enum.Material.Fabric, CF(0, -0.6, 0))
	deco(model, P.pelvis, "Hem", Vector3.new(2.8, 0.2, 1.9), Color3.fromRGB(235, 230, 220), Enum.Material.Fabric, CF(0, -1.5, 0))
	deco(model, P.torso, "Collar", Vector3.new(1.6, 0.25, 1.2), Color3.fromRGB(235, 230, 220), Enum.Material.Fabric, CF(0, 1.6, -0.05))
	P.torso.Color = red; P.torso.Material = Enum.Material.Fabric
	for _, h in ipairs({ P.LHand, P.RHand }) do claws(model, h, s.skin, 0.9, 3) end
end

DECOR.Oni = function(model, P, s)
	local bone, black = Color3.fromRGB(230, 220, 190), Color3.fromRGB(12, 10, 10)
	-- máscara
	local mask = deco(model, P.head, "Mask", Vector3.new(1.35, 1.45, 0.22), Color3.fromRGB(235, 232, 225), Enum.Material.SmoothPlastic, CF(0, 0.05, -0.68))
	for _, side in ipairs({ -1, 1 }) do
		local eye = deco(model, mask, "Eye", Vector3.new(0.38, 0.14, 0.05), s.glow, Enum.Material.Neon, CF(side * 0.3, 0.25, -0.12) * ANG(0, 0, rad(side * -15)))
		if side == 1 then light(eye, s.glow, 7, 2) end
		deco(model, mask, "Mark", Vector3.new(0.08, 0.6, 0.05), Color3.fromRGB(170, 10, 10), nil, CF(side * 0.48, -0.05, -0.12) * ANG(0, 0, rad(side * 10)))
		-- chifres (3 segmentos)
		local c0 = CF(side * 0.45, 0.75, -0.1) * ANG(rad(-10), 0, rad(side * -25))
		for k = 0, 2 do
			local sz = 0.42 - k * 0.12
			deco(model, P.head, "Horn", Vector3.new(sz, 0.55, sz), bone, Enum.Material.SmoothPlastic, c0 * CF(0, 0.25 + k * 0.45, 0) * ANG(0, 0, rad(side * -12 * k)))
		end
	end
	deco(model, mask, "MouthHole", Vector3.new(0.9, 0.35, 0.05), black, nil, CF(0, -0.42, -0.12))
	for i = -2, 2 do deco(model, mask, "Fang", Vector3.new(0.12, 0.3, 0.06), Color3.new(1, 1, 1), nil, CF(i * 0.18, -0.36, -0.15) * ANG(0, 0, rad(180)), Enum.PartType.Wedge) end
	-- cabelo selvagem
	for i = 1, 9 do
		local a = (i / 9) * math.pi - math.pi / 2
		deco(model, P.head, "Spike", Vector3.new(0.3, 1.1, 0.3), black, Enum.Material.Fabric,
			CF(math.sin(a) * 0.6, 0.35, 0.5) * ANG(rad(55), 0, -a * 0.8) * CF(0, 0.4, 0), Enum.PartType.Wedge)
	end
	-- ombreiras e corda
	for _, side in ipairs({ -1, 1 }) do
		deco(model, P.torso, "Pauldron", Vector3.new(1.0, 0.35, 1.3), Color3.fromRGB(25, 25, 28), Enum.Material.Metal, CF(side * 1.25, 1.6, 0) * ANG(0, 0, rad(side * -20)))
	end
	deco(model, P.pelvis, "Rope", Vector3.new(0.35, 1.3, 1.3), bone, Enum.Material.Fabric, CF(0, 0.2, 0) * ANG(0, 0, rad(90)), Enum.PartType.Cylinder)
	for i = 0, 2 do deco(model, P.torso, "Stripe", Vector3.new(1.9, 0.12, 0.05), black, nil, CF(0, 0.6 - i * 0.6, -0.57) * ANG(0, 0, rad(10 - i * 10))) end
	for _, h in ipairs({ P.LHand, P.RHand }) do claws(model, h, black, 1.5, 3) end
end

DECOR.Shadow = function(model, P, s)
	for _, p in ipairs(model:GetChildren()) do
		if p:IsA("BasePart") then p.Transparency = 0.12 end
	end
	for _, side in ipairs({ -1, 1 }) do
		local e = deco(model, P.head, "Eye", Vector3.new(0.22, 0.12, 0.08), s.glow, Enum.Material.Neon, CF(side * 0.3, 0.2, -0.7), Enum.PartType.Ball)
		if side == 1 then light(e, s.glow, 8, 1.5) end
	end
	local function smoke(to)
		local pe = Instance.new("ParticleEmitter")
		pe.Texture = "rbxasset://textures/particles/smoke_main.dds"
		pe.Color = ColorSequence.new(Color3.fromRGB(0, 0, 0)); pe.Transparency = NumberSequence.new(0.4, 1)
		pe.Size = NumberSequence.new(1.2, 3); pe.Lifetime = NumberRange.new(0.8, 1.6); pe.Rate = 14
		pe.Speed = NumberRange.new(0.5, 1.5); pe.SpreadAngle = Vector2.new(180, 180); pe.LightInfluence = 0
		pe.Parent = to
	end
	smoke(P.torso); smoke(P.head); smoke(P.LLowerArm); smoke(P.RLowerArm)
	for _, h in ipairs({ P.LHand, P.RHand }) do claws(model, h, Color3.fromRGB(2, 2, 2), 2.0, 3) end
end

-- ===================== esqueleto =====================
-- Constrói o corpo visual preso a `root`. rootHeight = altura do centro do root até o chão.
function F.BuildBody(model: Model, root: BasePart, skinId: string?, rootHeight: number)
	skinId = (skinId and SKINS[skinId]) and skinId or "Blinder"
	local s = SKINS[skinId]
	local yOff = rootHeight - 5
	local skin, mat = s.skin, s.mat
	local P = {}

	P.pelvis = part(model, "Pelvis", Vector3.new(1.8, 1, 1), skin, mat)
	motor("RootJoint", root, P.pelvis, CF(0, 0.6 - yOff, 0))
	P.torso = part(model, "Torso", Vector3.new(2.2, 3.4, 1.1), skin, mat)
	motor("Waist", P.pelvis, P.torso, CF(0, 0.5, 0) * ANG(rad(-22), 0, 0), CF(0, -1.7, 0))
	deco(model, P.torso, "NeckPart", Vector3.new(0.5, 1.0, 0.5), skin, mat, CF(0, 2.0, -0.15))
	P.head = part(model, "Head", Vector3.new(1.5, 1.8, 1.5), skin, mat, Enum.PartType.Ball)
	motor("Neck", P.torso, P.head, CF(0, 2.6, -0.25) * ANG(rad(20), 0, 0), CF(0, -0.5, 0))

	for _, side in ipairs({ -1, 1 }) do
		local tag = side < 0 and "L" or "R"
		local upper = part(model, tag .. "UpperArm", Vector3.new(0.55, 3.0, 0.55), skin, mat)
		motor(tag .. "Shoulder", P.torso, upper, CF(side * 1.35, 1.4, 0) * ANG(0, 0, side * rad(8)), CF(0, 1.35, 0))
		local lower = part(model, tag .. "LowerArm", Vector3.new(0.45, 3.2, 0.45), skin, mat)
		motor(tag .. "Elbow", upper, lower, CF(0, -1.45, 0), CF(0, 1.5, 0))
		local hand = part(model, tag .. "Hand", Vector3.new(0.6, 0.6, 0.35), skin, mat)
		weld(lower, hand, CF(0, -1.85, 0))
		P[tag .. "UpperArm"], P[tag .. "LowerArm"], P[tag .. "Hand"] = upper, lower, hand

		local thigh = part(model, tag .. "Thigh", Vector3.new(0.7, 2.5, 0.7), skin, mat)
		motor(tag .. "Hip", P.pelvis, thigh, CF(side * 0.6, -0.4, 0), CF(0, 1.2, 0))
		local shin = part(model, tag .. "Shin", Vector3.new(0.55, 2.6, 0.55), skin, mat)
		motor(tag .. "Knee", thigh, shin, CF(0, -1.2, 0), CF(0, 1.25, 0))
		local foot = part(model, tag .. "Foot", Vector3.new(0.6, 0.3, 1.3), skin, mat)
		weld(shin, foot, CF(0, -1.35, -0.3))
		P[tag .. "Thigh"], P[tag .. "Shin"], P[tag .. "Foot"] = thigh, shin, foot
	end

	DECOR[skinId](model, P, s)
	return P.head
end

-- Cria o monstro controlado por IA (Humanoid + root invisível)
function F.CreateAIOld(skinId: string?): Model
	local model = Instance.new("Model")
	model.Name = "Blinder"
	local root = Instance.new("Part")
	root.Name = "HumanoidRootPart"; root.Size = Vector3.new(2, 2, 1); root.Transparency = 1
	root.CanCollide = true; root.CanQuery = false; root.Parent = model
	model.PrimaryPart = root
	local hum = Instance.new("Humanoid")
	hum.HipHeight = 4
	hum.WalkSpeed = Config.MONSTER_WALK
	hum.MaxHealth = math.huge; hum.Health = math.huge
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	hum.BreakJointsOnDeath = false
	hum.RequiresNeck = false
	hum.Parent = model
	F.BuildBody(model, root, skinId, 5)
	model:SetAttribute("IsMonster", true)
	model:SetAttribute("Skin", skinId or "Blinder")
	F.AddSounds(root)
	return model
end

-- Modelo estático (vitrine do lobby)
function F.CreateStatic(skinId: string): Model
	local model = Instance.new("Model")
	model.Name = "Display_" .. skinId
	local root = Instance.new("Part")
	root.Name = "HumanoidRootPart"; root.Size = Vector3.new(2, 2, 1); root.Transparency = 1
	root.Anchored = true; root.CanCollide = false; root.CanQuery = false; root.Parent = model
	model.PrimaryPart = root
	F.BuildBody(model, root, skinId, 5)
	model:SetAttribute("Skin", skinId)
	return model
end

function F.AddSounds(root: BasePart)
	local function snd(name, id, vol, looped, maxd)
		local s = Instance.new("Sound"); s.Name = name; s.SoundId = id; s.Volume = vol; s.Looped = looped
		s.RollOffMode = Enum.RollOffMode.InverseTapered; s.RollOffMinDistance = 8; s.RollOffMaxDistance = maxd; s.Parent = root
		return s
	end
	snd("Run", Config.Sounds.MonsterRun, 2.2, true, 140)
	snd("Growl", Config.Sounds.Growl, 1.4, true, 60)
	snd("Scream", Config.Sounds.Scream, 3, false, 220)
end

return F
