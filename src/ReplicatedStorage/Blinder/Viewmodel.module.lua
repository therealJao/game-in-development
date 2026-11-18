-- BLINDER :: mãos em primeira pessoa + martelo (viewmodel)
-- Tudo é posicionado relativo ao "grip" (centro do punho fechado no cabo).
-- Eixos do grip: +Y = ao longo do cabo (para cima), -Z = para frente, +X = direita.
local RS = game:GetService("ReplicatedStorage")
local VM = {}

local rad = math.rad
local SKIN = Color3.fromRGB(214, 168, 138)
local SKIN_DARK = Color3.fromRGB(186, 140, 112)
local SLEEVE = Color3.fromRGB(34, 34, 40)
local CUFF = Color3.fromRGB(24, 24, 28)

local function mk(parent, name, size, color, mat, shape)
	local p = Instance.new("Part")
	p.Name = name; p.Size = size; p.Color = color; p.Material = mat or Enum.Material.SmoothPlastic
	p.Anchored = true; p.CanCollide = false; p.CanQuery = false; p.CanTouch = false; p.CastShadow = false
	p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
	if shape then p.Shape = shape end
	p.Parent = parent
	return p
end

-- cilindro cujo eixo vai de a até b (no espaço do grip)
local function limb(list, parent, name, a: Vector3, b: Vector3, dia: number, color, mat, group)
	local d = (b - a)
	local len = d.Magnitude
	local center = (a + b) / 2
	local cf = CFrame.lookAt(center, center + d.Unit) * CFrame.Angles(0, rad(90), 0)
	local p = mk(parent, name, Vector3.new(len, dia, dia), color, mat, Enum.PartType.Cylinder)
	table.insert(list, { p = p, rel = cf, group = group })
	return p
end

local function block(list, parent, name, size, rel: CFrame, color, mat, group, shape)
	local p = mk(parent, name, size, color, mat, shape)
	table.insert(list, { p = p, rel = rel, group = group })
	return p
end

local GLOVE = Color3.fromRGB(42, 37, 34)
local GLOVE_LIGHT = Color3.fromRGB(62, 54, 48)
local leather = Enum.Material.Leather

-- elipsóide (bloco com malha de esfera = formas orgânicas)
local function ellipsoid(list, parent, name, size, rel, color, mat, group)
	local p = block(list, parent, name, size, rel, color, mat, group)
	local sm = Instance.new("SpecialMesh"); sm.MeshType = Enum.MeshType.Sphere; sm.Parent = p
	return p
end

-- cápsula: cilindro + esfera na ponta
local function capsule(list, parent, name, a, b, dia, color, mat, group, tip)
	local c = limb(list, parent, name, a, b, dia, color, mat, group)
	if tip then block(list, parent, name .. "Tip", Vector3.new(dia, dia, dia), CFrame.new(b), color, mat, group, Enum.PartType.Ball) end
	return c
end

local NAIL = Color3.fromRGB(226, 196, 182)
local DIRT = Color3.fromRGB(70, 52, 40)
local JACKET = Color3.fromRGB(38, 46, 58)
local JACKET_DARK = Color3.fromRGB(26, 32, 42)

local function buildHand(list, parent, group, mirror: number)
	-- mirror = 1 mão direita, -1 mão esquerda. Mão nua, suja e arranhada, com fita nos nós dos dedos.
	local m = mirror
	local parts = { skin = {}, fingers = {}, dirt = {} }
	local V = function(x, y, z) return Vector3.new(x * m, y, z) end
	-- palma (dorso arredondado + base do polegar)
	parts.palm = ellipsoid(list, parent, "Palm", Vector3.new(0.34, 0.74, 0.58), CFrame.new(V(0.21, -0.03, 0.04)), SKIN, nil, group)
	parts.back = ellipsoid(list, parent, "HandBack", Vector3.new(0.24, 0.7, 0.54), CFrame.new(V(0.3, -0.04, 0.02)) * CFrame.Angles(0, 0, rad(-6 * m)), SKIN_DARK, nil, group)
	ellipsoid(list, parent, "ThumbPad", Vector3.new(0.3, 0.42, 0.34), CFrame.new(V(0.14, -0.14, 0.15)), SKIN, nil, group)
	table.insert(parts.skin, parts.palm); table.insert(parts.skin, parts.back)
	-- tendões / veias no dorso
	for i, y in ipairs({ 0.16, 0.03, -0.1 }) do
		limb(list, parent, "Tendon", V(0.39, y + 0.02, -0.06), V(0.38, -0.3 + i * 0.03, 0.06), 0.035, SKIN_DARK, nil, group)
	end
	-- dedos: 3 falanges curvadas em volta do cabo + unhas
	local ys = { 0.245, 0.09, -0.065, -0.21 }
	for i, y in ipairs(ys) do
		local d = (i == 4) and 0.118 or (i == 2 and 0.142 or 0.136)
		local k = V(0.29, y, -0.11)
		local p1 = V(0.13, y - 0.004, -0.235)
		local p2 = V(-0.05, y - 0.008, -0.2)
		local tip = V(-0.15, y - 0.012, -0.06)
		block(list, parent, "Knuckle", Vector3.new(d * 1.2, d * 1.2, d * 1.2), CFrame.new(k), SKIN_DARK, nil, group, Enum.PartType.Ball)
		local a = capsule(list, parent, "Finger", k, p1, d, SKIN, nil, group, false)
		block(list, parent, "Joint", Vector3.new(d * 1.02, d * 1.02, d * 1.02), CFrame.new(p1), SKIN, nil, group, Enum.PartType.Ball)
		local b2 = capsule(list, parent, "FingerMid", p1, p2, d * 0.95, SKIN, nil, group, false)
		block(list, parent, "Joint", Vector3.new(d * 0.97, d * 0.97, d * 0.97), CFrame.new(p2), SKIN, nil, group, Enum.PartType.Ball)
		local c = capsule(list, parent, "FingerSkin", p2, tip, d * 0.9, SKIN, nil, group, true)
		-- unha (do lado de fora da ponta)
		local nd = (tip - p2).Unit
		block(list, parent, "Nail", Vector3.new(d * 0.7, d * 0.18, d * 0.75), CFrame.lookAt(tip - nd * 0.02 + V(-0.045, 0, 0), tip + nd) * CFrame.new(0, 0, 0), NAIL, nil, group)
		table.insert(parts.fingers, a); table.insert(parts.fingers, b2); table.insert(parts.fingers, c)
		-- sujeira nos nós
		local dd = block(list, parent, "Dirt", Vector3.new(d * 0.9, d * 0.5, d * 0.9), CFrame.new(k + V(0.04, 0, -0.02)), DIRT, Enum.Material.Sand, group)
		dd.Transparency = 0.5
		table.insert(parts.dirt, dd)
	end
	-- polegar em 2 falanges por trás do cabo
	local t0, t1, t2 = V(0.18, -0.05, 0.19), V(0.03, 0.2, 0.21), V(-0.1, 0.36, 0.12)
	capsule(list, parent, "Thumb", t0, t1, 0.17, SKIN, nil, group, false)
	block(list, parent, "ThumbJoint", Vector3.new(0.165, 0.165, 0.165), CFrame.new(t1), SKIN, nil, group, Enum.PartType.Ball)
	parts.thumb = capsule(list, parent, "ThumbSkin", t1, t2, 0.15, SKIN, nil, group, true)
	local tn = (t2 - t1).Unit
	block(list, parent, "Nail", Vector3.new(0.1, 0.03, 0.11), CFrame.lookAt(t2 + V(0, 0, 0.055), t2 + tn), NAIL, nil, group)
	-- arranhões
	for i = 1, 3 do
		local a = V(0.37, 0.2 - i * 0.12, -0.1 + i * 0.04)
		limb(list, parent, "Scratch", a, a + V(0.01, -0.12, 0.09), 0.022, Color3.fromRGB(150, 40, 36), nil, group)
	end
	-- pulso, relógio digital e antebraço com veias
	local wrist = V(0.25, -0.5, 0.13)
	local dir = Vector3.new(0.16 * m, -0.5, 0.85).Unit
	parts.wrist = ellipsoid(list, parent, "Wrist", Vector3.new(0.44, 0.34, 0.46), CFrame.new(wrist) * CFrame.Angles(rad(-28), 0, rad(-6 * m)), SKIN_DARK, nil, group)
	parts.forearm = limb(list, parent, "Forearm", wrist, wrist + dir * 1.0, 0.43, SKIN, nil, group)
	if m == 1 then
		limb(list, parent, "WatchBand", wrist + dir * 0.2, wrist + dir * 0.33, 0.47, Color3.fromRGB(18, 18, 20), Enum.Material.Rubber, group)
		local face = block(list, parent, "WatchFace", Vector3.new(0.2, 0.06, 0.22), CFrame.lookAt(wrist + dir * 0.27 + V(0.2, 0.05, 0), wrist + dir * 0.27 + V(0.2, 0.05, 0) + V(1, 0.4, 0)) * CFrame.Angles(rad(90), 0, 0), Color3.fromRGB(190, 20, 20), Enum.Material.Neon, group)
		parts.watch = face
	end
	for i = 1, 2 do
		limb(list, parent, "Vein", wrist + dir * 0.4 + V(0.13 + i * 0.04, 0.1, 0), wrist + dir * 0.95 + V(0.1 + i * 0.05, 0.12, 0), 0.04, Color3.fromRGB(150, 110, 110), nil, group)
	end
	-- jaqueta jeans com punho dobrado e manga rasgada
	limb(list, parent, "Cuff", wrist + dir * 0.75, wrist + dir * 1.05, 0.66, JACKET_DARK, Enum.Material.Fabric, group)
	parts.sleeve = limb(list, parent, "Sleeve", wrist + dir * 1.0, wrist + dir * 3.8, 0.78, JACKET, Enum.Material.Fabric, group)
	for i = 1, 3 do limb(list, parent, "Fold", wrist + dir * (1.2 + i * 0.6), wrist + dir * (1.3 + i * 0.6), 0.82, JACKET_DARK, Enum.Material.Fabric, group) end
	block(list, parent, "Tear", Vector3.new(0.3, 0.25, 0.05), CFrame.lookAt(wrist + dir * 1.6 + V(0.38, 0.1, 0), wrist + dir * 1.6 + V(2, 0.1, 0)), Color3.fromRGB(60, 40, 36), Enum.Material.Fabric, group)
	table.insert(parts.skin, parts.forearm)
	-- fita adesiva nos nós dos dedos (aparece quando as mãos estão machucadas)
	parts.wraps = {}
	for _, y in ipairs({ 0.17, -0.02, -0.19 }) do
		local w = limb(list, parent, "Wrap", V(0.37, y, -0.02), V(0.37, y, -0.24), 0.17, Color3.fromRGB(226, 220, 204), Enum.Material.Fabric, group)
		w.Transparency = 1
		table.insert(parts.wraps, w)
	end
	-- sangue escorrendo dos nós
	parts.blood = {}
	for _, y in ipairs({ 0.2, 0.05, -0.12, -0.25 }) do
		local b = block(list, parent, "Blood", Vector3.new(0.07, 0.2, 0.1), CFrame.new(V(0.39, y - 0.06, -0.14)), Color3.fromRGB(110, 6, 8), Enum.Material.Glass, group)
		b.Transparency = 1
		table.insert(parts.blood, b)
	end
	return parts
end

-- malha do martelo para uma skin (cai no padrão se não existir)
function VM.hammerSource(skinId: string?): (BasePart?, number)
	local A = RS.Blinder.Assets
	local f = A:FindFirstChild("HammerSkins")
	local src = (skinId and skinId ~= "Default" and f and f:FindFirstChild(skinId)) or A:FindFirstChild("Hammer")
	return src, (src and src:GetAttribute("RotY")) or 0
end

-- troca o martelo do viewmodel pela skin escolhida
function VM.setHammer(rig, skinId: string?)
	if not rig or not rig.hammerEntry then return end
	local src, rotY = VM.hammerSource(skinId)
	if not src then return end
	local h = src:Clone()
	h.Name = "Hammer"; h.Anchored = true; h.CanCollide = false; h.CanQuery = false; h.CastShadow = false
	h.Parent = rig.model
	if rig.hammer then rig.hammer:Destroy() end
	rig.hammer = h
	rig.hammerEntry.p = h
	rig.hammerEntry.rel = CFrame.new(0, 0.9, 0) * CFrame.Angles(0, rad(143 + rotY), 0)
end

function VM.build(parent: Instance)
	local rig = { list = {} }
	local model = Instance.new("Model"); model.Name = "Viewmodel"
	rig.model = model
	-- martelo (malha gerada)
	local src = RS.Blinder.Assets:FindFirstChild("Hammer")
	local hammer
	if src then
		hammer = src:Clone()
		hammer.Anchored = true; hammer.CastShadow = false
		hammer.Parent = model
	else
		hammer = mk(model, "Hammer", Vector3.new(0.25, 2.5, 0.25), Color3.fromRGB(110, 70, 40), Enum.Material.Wood)
	end
	-- cabo atravessa o punho: grip fica ~0.88 abaixo do centro do martelo; face de bater para frente
	local entry = { p = hammer, rel = CFrame.new(0, 0.9, 0) * CFrame.Angles(0, rad(143), 0), group = "R" }
	table.insert(rig.list, entry)
	rig.hammer = hammer
	rig.hammerEntry = entry
	rig.right = buildHand(rig.list, model, "R", 1)
	-- mão esquerda (só aparece colocando atadura) segurando o rolo
	rig.left = buildHand(rig.list, model, "L", -1)
	local roll = block(rig.list, model, "BandageRoll", Vector3.new(0.5, 0.42, 0.42), CFrame.new(0, 0.02, -0.12), Color3.fromRGB(238, 232, 218), Enum.Material.Fabric, "L", Enum.PartType.Cylinder)
	rig.roll = roll
	model.Parent = parent
	return rig
end

-- posiciona tudo. right/left = CFrame do grip de cada mão no mundo. leftVisible controla a mão esquerda.
function VM.apply(rig, right: CFrame, left: CFrame?, leftVisible: boolean, hands01: number)
	for _, e in ipairs(rig.list) do
		if e.group == "R" then
			e.p.CFrame = right * e.rel
		elseif left then
			e.p.CFrame = left * e.rel
		end
		if e.group == "L" then
			local hide = not leftVisible
			if e.p.Name == "Wrap" or e.p.Name == "Dirt" or e.p.Name == "Blood" then hide = true end
			e.p.LocalTransparencyModifier = hide and 1 or 0
		end
	end
	-- feridas da mão direita: dedos avermelham, sujeira, fita e sangue aparecem
	local hurt = 1 - math.clamp(hands01, 0, 1)
	local skinNow = SKIN:Lerp(Color3.fromRGB(165, 72, 60), hurt * 0.6)
	for _, f in ipairs(rig.right.fingers) do f.Color = skinNow end
	if rig.right.thumb then rig.right.thumb.Color = skinNow end
	for _, d in ipairs(rig.right.dirt) do d.Transparency = 0.75 - hurt * 0.6 end
	for _, w in ipairs(rig.right.wraps) do w.Transparency = (hands01 < 0.65) and 0 or 1 end
	for _, b in ipairs(rig.right.blood) do b.Transparency = (hands01 < 0.3) and 0.05 or 1 end
	if rig.right.watch then
		-- relógio piscando 03:00
		rig.right.watch.Transparency = (os.clock() % 1 < 0.5) and 0 or 0.4
	end
end

return VM
