-- BLINDER :: construtores de props (usado só em tempo de edição para gerar mapas)
local CS = game:GetService("CollectionService")
local B = {}
local idCounter = 0

function B.part(parent, props)
	local p = Instance.new(props.Shape and "Part" or "Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do p[k] = v end
	p.Parent = parent
	return p
end

local function cyl(parent, cf, height, diameter, props)
	props = props or {}
	props.Shape = Enum.PartType.Cylinder
	props.Size = Vector3.new(height, diameter, diameter)
	props.CFrame = cf * CFrame.Angles(0, 0, math.rad(90))
	return B.part(parent, props)
end
B.cyl = cyl

local function newBreakable(kind, cf)
	idCounter += 1
	local m = Instance.new("Model")
	m.Name = kind
	m:SetAttribute("Breakable", kind)
	m:SetAttribute("BId", kind .. "_" .. idCounter)
	CS:AddTag(m, "Breakable")
	return m
end

local function finish(m, primary, parent)
	m.PrimaryPart = primary
	m.Parent = parent
	return m
end

-- ===== Quebráveis =====
function B.Vase(parent, cf)
	local m = newBreakable("Vase", cf)
	local colors = { Color3.fromRGB(200,205,215), Color3.fromRGB(60,80,140), Color3.fromRGB(150,40,40), Color3.fromRGB(190,160,90) }
	local c = colors[math.random(#colors)]
	local body = B.part(m, { Name = "Body", Shape = Enum.PartType.Ball, Size = Vector3.new(1.8,1.8,1.8), CFrame = cf * CFrame.new(0,0.9,0), Color = c, Material = Enum.Material.Glass, Reflectance = 0.05 })
	cyl(m, cf * CFrame.new(0,2.0,0), 0.9, 0.8, { Color = c, Material = Enum.Material.Glass })
	cyl(m, cf * CFrame.new(0,2.5,0), 0.15, 1.1, { Color = c, Material = Enum.Material.Glass })
	return finish(m, body, parent)
end

function B.Lamp(parent, cf)
	local m = newBreakable("Lamp", cf)
	local base = cyl(m, cf * CFrame.new(0,0.15,0), 0.3, 1.2, { Name = "Base", Color = Color3.fromRGB(40,35,30), Material = Enum.Material.Metal })
	cyl(m, cf * CFrame.new(0,1.3,0), 2.2, 0.2, { Color = Color3.fromRGB(40,35,30), Material = Enum.Material.Metal })
	local shade = cyl(m, cf * CFrame.new(0,2.6,0), 1.1, 1.6, { Name = "Shade", Color = Color3.fromRGB(255,214,150), Material = Enum.Material.Neon, Transparency = 0.25 })
	local l = Instance.new("PointLight"); l.Range = 14; l.Brightness = 0.9; l.Color = Color3.fromRGB(255,190,120); l.Shadows = true; l.Parent = shade
	return finish(m, base, parent)
end

function B.Chair(parent, cf)
	local m = newBreakable("Chair", cf)
	local wood = { Color = Color3.fromRGB(85,55,35), Material = Enum.Material.Wood }
	local function w(t) for k, v in pairs(wood) do t[k] = v end return t end
	local seat = B.part(m, w({ Name = "Seat", Size = Vector3.new(2.4,0.3,2.4), CFrame = cf * CFrame.new(0,1.9,0) }))
	B.part(m, w({ Size = Vector3.new(2.4,2.8,0.3), CFrame = cf * CFrame.new(0,3.4,1.05) }))
	for _, o in ipairs({ {-1,-1},{1,-1},{-1,1},{1,1} }) do
		B.part(m, w({ Size = Vector3.new(0.3,1.9,0.3), CFrame = cf * CFrame.new(o[1]*1.0,0.95,o[2]*1.0) }))
	end
	B.part(m, { Size = Vector3.new(2.2,0.15,2.2), CFrame = cf * CFrame.new(0,2.1,0), Color = Color3.fromRGB(90,20,25), Material = Enum.Material.Fabric })
	return finish(m, seat, parent)
end

function B.TV(parent, cf)
	local m = newBreakable("TV", cf)
	local cab = B.part(m, { Name = "Cabinet", Size = Vector3.new(5,2.2,2.2), CFrame = cf * CFrame.new(0,1.1,0), Color = Color3.fromRGB(55,38,25), Material = Enum.Material.Wood })
	B.part(m, { Size = Vector3.new(4,3,2.6), CFrame = cf * CFrame.new(0,3.7,0), Color = Color3.fromRGB(30,28,26), Material = Enum.Material.SmoothPlastic })
	local scr = B.part(m, { Name = "Screen", Size = Vector3.new(3.2,2.3,0.1), CFrame = cf * CFrame.new(0,3.75,-1.31), Color = Color3.fromRGB(120,140,160), Material = Enum.Material.Neon, Transparency = 0.35 })
	local l = Instance.new("SurfaceLight"); l.Face = Enum.NormalId.Front; l.Range = 12; l.Brightness = 0.6; l.Color = Color3.fromRGB(150,170,200); l.Parent = scr
	scr:SetAttribute("Static", true)
	return finish(m, cab, parent)
end

function B.Piano(parent, cf)
	local m = newBreakable("Piano", cf)
	local black = { Color = Color3.fromRGB(15,15,17), Material = Enum.Material.SmoothPlastic, Reflectance = 0.12 }
	local function k(t) for a, v in pairs(black) do t[a] = v end return t end
	local body = B.part(m, k({ Name = "Body", Size = Vector3.new(7,4.6,2.6), CFrame = cf * CFrame.new(0,3.3,0.6) }))
	B.part(m, k({ Size = Vector3.new(7,0.6,1.6), CFrame = cf * CFrame.new(0,2.6,-1.4) }))
	B.part(m, { Size = Vector3.new(6.6,0.2,1.0), CFrame = cf * CFrame.new(0,2.95,-1.6), Color = Color3.fromRGB(235,232,220), Material = Enum.Material.SmoothPlastic })
	for i = -3, 3 do
		B.part(m, { Size = Vector3.new(0.18,0.22,0.6), CFrame = cf * CFrame.new(i*0.9+0.45,3.05,-1.4), Color = Color3.fromRGB(10,10,10), Material = Enum.Material.SmoothPlastic })
	end
	for _, x in ipairs({-3.2, 3.2}) do B.part(m, k({ Size = Vector3.new(0.5,2.4,0.5), CFrame = cf * CFrame.new(x,1.2,-1.6) })) end
	return finish(m, body, parent)
end

function B.Statue(parent, cf)
	local m = newBreakable("Statue", cf)
	local marble = { Color = Color3.fromRGB(205,200,190), Material = Enum.Material.Marble }
	local function mm(t) for a, v in pairs(marble) do t[a] = v end return t end
	local ped = B.part(m, { Name = "Pedestal", Size = Vector3.new(3,3,3), CFrame = cf * CFrame.new(0,1.5,0), Color = Color3.fromRGB(60,60,64), Material = Enum.Material.Slate })
	B.part(m, mm({ Size = Vector3.new(1.6,2.6,1.0), CFrame = cf * CFrame.new(0,4.3,0) }))
	B.part(m, mm({ Shape = Enum.PartType.Ball, Size = Vector3.new(1.2,1.2,1.2), CFrame = cf * CFrame.new(0,6.2,0) }))
	B.part(m, mm({ Size = Vector3.new(0.5,2.4,0.5), CFrame = cf * CFrame.new(-1.05,4.4,0) * CFrame.Angles(0,0,math.rad(-12)) }))
	B.part(m, mm({ Size = Vector3.new(0.5,2.6,0.5), CFrame = cf * CFrame.new(1.1,5.4,-0.3) * CFrame.Angles(math.rad(-30),0,math.rad(160)) }))
	-- olhos vazados (Blinder: tudo é cego)
	B.part(m, { Size = Vector3.new(0.9,0.18,0.1), CFrame = cf * CFrame.new(0,6.3,-0.58), Color = Color3.fromRGB(20,20,20), Material = Enum.Material.SmoothPlastic })
	return finish(m, ped, parent)
end

function B.Safe(parent, cf)
	local m = newBreakable("Safe", cf)
	local body = B.part(m, { Name = "Body", Size = Vector3.new(3.4,3.8,3), CFrame = cf * CFrame.new(0,1.9,0), Color = Color3.fromRGB(45,50,48), Material = Enum.Material.DiamondPlate })
	B.part(m, { Size = Vector3.new(2.8,3.2,0.15), CFrame = cf * CFrame.new(0,1.9,-1.55), Color = Color3.fromRGB(70,75,72), Material = Enum.Material.Metal })
	cyl(m, cf * CFrame.new(0.4,2.2,-1.7) * CFrame.Angles(math.rad(90),0,0), 0.2, 0.9, { Color = Color3.fromRGB(180,160,90), Material = Enum.Material.Metal })
	B.part(m, { Size = Vector3.new(0.2,1.0,0.2), CFrame = cf * CFrame.new(-0.9,1.9,-1.75), Color = Color3.fromRGB(180,160,90), Material = Enum.Material.Metal })
	return finish(m, body, parent)
end

-- ===== Quebráveis da pizzaria =====
function B.Plush(parent, cf)
	local m = newBreakable("Plush", cf)
	local colors = { Color3.fromRGB(150, 90, 50), Color3.fromRGB(110, 90, 200), Color3.fromRGB(230, 200, 60), Color3.fromRGB(220, 120, 160) }
	local c = colors[math.random(#colors)]
	local body = B.part(m, { Name = "Body", Shape = Enum.PartType.Ball, Size = Vector3.new(1.3, 1.4, 1.1), CFrame = cf * CFrame.new(0, 0.7, 0), Color = c, Material = Enum.Material.Fabric })
	B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(1.1, 1.1, 1.1), CFrame = cf * CFrame.new(0, 1.75, 0), Color = c, Material = Enum.Material.Fabric })
	for _, s in ipairs({ -1, 1 }) do
		B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.4, 0.4, 0.3), CFrame = cf * CFrame.new(s * 0.4, 2.25, 0), Color = c, Material = Enum.Material.Fabric })
		B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.18, 0.18, 0.1), CFrame = cf * CFrame.new(s * 0.2, 1.85, -0.5), Color = Color3.new(0, 0, 0), Material = Enum.Material.SmoothPlastic })
	end
	return finish(m, body, parent)
end

function B.Arcade(parent, cf)
	local m = newBreakable("Arcade", cf)
	local hue = math.random()
	local body = B.part(m, { Name = "Cabinet", Size = Vector3.new(3.2, 6.6, 2.6), CFrame = cf * CFrame.new(0, 3.3, 0), Color = Color3.fromHSV(hue, 0.6, 0.35), Material = Enum.Material.SmoothPlastic })
	local scr = B.part(m, { Name = "Screen", Size = Vector3.new(2.5, 2.0, 0.1), CFrame = cf * CFrame.new(0, 4.4, -1.25) * CFrame.Angles(math.rad(-12), 0, 0), Color = Color3.fromHSV((hue + 0.5) % 1, 0.7, 0.9), Material = Enum.Material.Neon, Transparency = 0.25 })
	scr:SetAttribute("Static", true)
	local l = Instance.new("SurfaceLight"); l.Face = Enum.NormalId.Front; l.Range = 10; l.Brightness = 0.7; l.Color = scr.Color; l.Parent = scr
	B.part(m, { Size = Vector3.new(3.2, 0.9, 1.4), CFrame = cf * CFrame.new(0, 2.7, -1.6), Color = Color3.fromRGB(25, 25, 28), Material = Enum.Material.SmoothPlastic })
	B.part(m, { Size = Vector3.new(0.15, 0.6, 0.15), CFrame = cf * CFrame.new(-0.6, 3.4, -1.8), Color = Color3.fromRGB(20, 20, 20), Material = Enum.Material.SmoothPlastic })
	B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.35, 0.35, 0.35), CFrame = cf * CFrame.new(-0.6, 3.75, -1.8), Color = Color3.fromRGB(220, 30, 30), Material = Enum.Material.SmoothPlastic })
	for i = 0, 2 do
		B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.3, 0.3, 0.3), CFrame = cf * CFrame.new(0.2 + i * 0.4, 3.2, -1.95), Color = Color3.fromHSV(i / 3, 0.8, 1), Material = Enum.Material.Neon })
	end
	local marquee = B.part(m, { Name = "Marquee", Size = Vector3.new(3.2, 1, 0.3), CFrame = cf * CFrame.new(0, 6.2, -1.3), Color = Color3.fromHSV(hue, 0.8, 1), Material = Enum.Material.Neon, Transparency = 0.15 })
	return finish(m, body, parent)
end

function B.Oven(parent, cf)
	local m = newBreakable("Oven", cf)
	local steel = Color3.fromRGB(150, 150, 155)
	local body = B.part(m, { Name = "Body", Size = Vector3.new(6, 4.2, 4), CFrame = cf * CFrame.new(0, 2.1, 0), Color = steel, Material = Enum.Material.DiamondPlate })
	local win = B.part(m, { Name = "Window", Size = Vector3.new(4, 1.4, 0.1), CFrame = cf * CFrame.new(0, 2.5, -2.02), Color = Color3.fromRGB(255, 120, 30), Material = Enum.Material.Neon, Transparency = 0.3 })
	local l = Instance.new("SurfaceLight"); l.Face = Enum.NormalId.Front; l.Range = 9; l.Brightness = 1.2; l.Color = Color3.fromRGB(255, 120, 40); l.Parent = win
	B.part(m, { Size = Vector3.new(4.4, 0.25, 0.25), CFrame = cf * CFrame.new(0, 3.5, -2.2), Color = Color3.fromRGB(40, 40, 42), Material = Enum.Material.Metal })
	B.part(m, { Size = Vector3.new(6, 2.2, 3.6), CFrame = cf * CFrame.new(0, 5.3, 0.2), Color = steel, Material = Enum.Material.Metal })
	for i = -2, 2 do B.cyl(m, cf * CFrame.new(i * 1.0, 4.6, -2.05) * CFrame.Angles(math.rad(90), 0, 0) * CFrame.Angles(0, 0, math.rad(90)), 0.2, 0.35, { Color = Color3.fromRGB(30, 30, 30), Material = Enum.Material.Metal }) end
	return finish(m, body, parent)
end

-- mascote animatrônico (urso / coelho / galinha), quebrável e enorme
function B.AnimatronicStatue(parent, cf, variant)
	local m = newBreakable("Animatronic", cf)
	local palette = {
		Bear = { fur = Color3.fromRGB(110, 70, 40), tan = Color3.fromRGB(175, 135, 90) },
		Bunny = { fur = Color3.fromRGB(70, 80, 170), tan = Color3.fromRGB(150, 160, 220) },
		Chicken = { fur = Color3.fromRGB(220, 190, 50), tan = Color3.fromRGB(240, 230, 200) },
	}
	local p = palette[variant] or palette.Bear
	local metal = Color3.fromRGB(120, 120, 125)
	local function fp(t) t.Material = t.Material or Enum.Material.Fabric; return B.part(m, t) end
	local legs = {}
	for _, s in ipairs({ -1, 1 }) do
		fp({ Size = Vector3.new(1.2, 3.2, 1.2), CFrame = cf * CFrame.new(s * 0.8, 1.9, 0), Color = p.fur })
		fp({ Size = Vector3.new(1.4, 0.6, 2), CFrame = cf * CFrame.new(s * 0.8, 0.3, -0.3), Color = p.fur })
	end
	local torso = fp({ Name = "Torso", Size = Vector3.new(3.2, 3.6, 2.2), CFrame = cf * CFrame.new(0, 5.3, 0), Color = p.fur })
	fp({ Size = Vector3.new(2.2, 2.6, 0.2), CFrame = cf * CFrame.new(0, 5.1, -1.12), Color = p.tan })
	for _, s in ipairs({ -1, 1 }) do
		fp({ Size = Vector3.new(0.9, 3.2, 0.9), CFrame = cf * CFrame.new(s * 2.1, 5.0, 0) * CFrame.Angles(0, 0, s * math.rad(8)), Color = p.fur })
		B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.6, 0.6, 0.6), CFrame = cf * CFrame.new(s * 2.25, 3.2, 0), Color = metal, Material = Enum.Material.Metal })
	end
	local head = B.part(m, { Shape = Enum.PartType.Ball, Name = "Head", Size = Vector3.new(2.6, 2.4, 2.4), CFrame = cf * CFrame.new(0, 8.4, -0.1) * CFrame.Angles(math.rad(8), 0, math.rad(-6)), Color = p.fur, Material = Enum.Material.Fabric })
	local hcf = head.CFrame
	B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(1.4, 0.9, 0.9), CFrame = hcf * CFrame.new(0, -0.45, -1.0), Color = p.tan, Material = Enum.Material.Fabric })
	for _, s in ipairs({ -1, 1 }) do
		B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.6, 0.6, 0.4), CFrame = hcf * CFrame.new(s * 0.5, 0.3, -1.05), Color = Color3.fromRGB(10, 10, 10), Material = Enum.Material.SmoothPlastic })
		local eye = B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.18, 0.18, 0.1), CFrame = hcf * CFrame.new(s * 0.5, 0.3, -1.27), Color = Color3.new(1, 1, 1), Material = Enum.Material.Neon })
		if s == 1 then local l = Instance.new("PointLight"); l.Range = 6; l.Brightness = 1; l.Color = Color3.new(1, 1, 1); l.Parent = eye end
		if variant == "Bunny" then
			B.part(m, { Size = Vector3.new(0.5, 2.6, 0.3), CFrame = hcf * CFrame.new(s * 0.55, 2.2, 0.1) * CFrame.Angles(0, 0, s * math.rad(-10)), Color = p.fur, Material = Enum.Material.Fabric })
		elseif variant == "Bear" then
			B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.8, 0.8, 0.4), CFrame = hcf * CFrame.new(s * 1.0, 1.0, 0.1), Color = p.fur, Material = Enum.Material.Fabric })
		end
	end
	if variant == "Chicken" then
		B.part(m, { Shape = Enum.PartType.Wedge, Size = Vector3.new(0.9, 0.5, 0.9), CFrame = hcf * CFrame.new(0, -0.35, -1.5) * CFrame.Angles(math.rad(90), 0, 0), Color = Color3.fromRGB(240, 140, 30), Material = Enum.Material.SmoothPlastic })
		local bib = B.part(m, { Size = Vector3.new(2.4, 1.4, 0.1), CFrame = cf * CFrame.new(0, 6.0, -1.2), Color = Color3.fromRGB(240, 240, 235), Material = Enum.Material.Fabric })
	elseif variant == "Bear" then
		B.cyl(m, hcf * CFrame.new(0, 1.35, 0), 0.9, 0.9, { Color = Color3.fromRGB(15, 15, 15), Material = Enum.Material.SmoothPlastic })
		B.cyl(m, hcf * CFrame.new(0, 0.95, 0), 0.1, 1.5, { Color = Color3.fromRGB(15, 15, 15), Material = Enum.Material.SmoothPlastic })
	end
	-- mandíbula metálica exposta
	B.part(m, { Size = Vector3.new(1.1, 0.2, 0.7), CFrame = hcf * CFrame.new(0, -1.0, -0.8) * CFrame.Angles(math.rad(20), 0, 0), Color = metal, Material = Enum.Material.Metal })
	return finish(m, torso, parent)
end

-- ===== Quebráveis do colégio =====
function B.Desk(parent, cf)
	local m = newBreakable("Desk", cf)
	local wood = Color3.fromRGB(196, 150, 96)
	local metal = Color3.fromRGB(70, 96, 120)
	local top = B.part(m, { Name = "Top", Size = Vector3.new(3.2, 0.25, 2.2), CFrame = cf * CFrame.new(0, 2.6, 0), Color = wood, Material = Enum.Material.Wood })
	B.part(m, { Size = Vector3.new(3.0, 0.9, 0.1), CFrame = cf * CFrame.new(0, 2.1, -1.0), Color = metal, Material = Enum.Material.Metal })
	for _, o in ipairs({ { -1, -1 }, { 1, -1 }, { -1, 1 }, { 1, 1 } }) do
		B.part(m, { Size = Vector3.new(0.15, 2.5, 0.15), CFrame = cf * CFrame.new(o[1] * 1.4, 1.25, o[2] * 0.9), Color = metal, Material = Enum.Material.Metal })
	end
	-- cadeirinha acoplada
	B.part(m, { Size = Vector3.new(2.0, 0.2, 1.6), CFrame = cf * CFrame.new(0, 1.6, 2.0), Color = wood, Material = Enum.Material.Wood })
	B.part(m, { Size = Vector3.new(2.0, 1.6, 0.2), CFrame = cf * CFrame.new(0, 2.5, 2.8), Color = wood, Material = Enum.Material.Wood })
	for _, x in ipairs({ -0.85, 0.85 }) do B.part(m, { Size = Vector3.new(0.15, 1.6, 0.15), CFrame = cf * CFrame.new(x, 0.8, 2.0), Color = metal, Material = Enum.Material.Metal }) end
	-- caderno e lápis
	B.part(m, { Size = Vector3.new(1.1, 0.06, 0.8), CFrame = cf * CFrame.new(-0.4, 2.76, 0) * CFrame.Angles(0, math.rad(math.random(-20, 20)), 0), Color = Color3.fromHSV(math.random(), 0.5, 0.8), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	B.part(m, { Size = Vector3.new(0.6, 0.08, 0.08), CFrame = cf * CFrame.new(0.7, 2.77, 0.2) * CFrame.Angles(0, math.rad(30), 0), Color = Color3.fromRGB(240, 200, 40), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	return finish(m, top, parent)
end

function B.Globe(parent, cf)
	local m = newBreakable("Globe", cf)
	local base = cyl(m, cf * CFrame.new(0, 0.1, 0), 0.2, 1.0, { Name = "Base", Color = Color3.fromRGB(60, 40, 25), Material = Enum.Material.Wood })
	cyl(m, cf * CFrame.new(0, 0.6, 0), 0.9, 0.12, { Color = Color3.fromRGB(180, 150, 70), Material = Enum.Material.Metal })
	B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(1.5, 1.5, 1.5), CFrame = cf * CFrame.new(0, 1.7, 0), Color = Color3.fromRGB(60, 120, 200), Material = Enum.Material.SmoothPlastic })
	for i = 1, 4 do
		B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(0.5 + math.random() * 0.3, 0.4, 0.4), CFrame = cf * CFrame.new(0, 1.7, 0) * CFrame.Angles(math.random() * 6, math.random() * 6, 0) * CFrame.new(0, 0, -0.62), Color = Color3.fromRGB(90, 170, 80), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	B.part(m, { Size = Vector3.new(0.08, 1.9, 0.08), CFrame = cf * CFrame.new(0, 1.7, 0) * CFrame.Angles(0, 0, math.rad(23)), Color = Color3.fromRGB(180, 150, 70), Material = Enum.Material.Metal })
	return finish(m, base, parent)
end

function B.Computer(parent, cf)
	local m = newBreakable("Computer", cf)
	local beige = Color3.fromRGB(214, 206, 186)
	local body = B.part(m, { Name = "Monitor", Size = Vector3.new(2.2, 1.9, 1.8), CFrame = cf * CFrame.new(0, 1.35, 0.1), Color = beige, Material = Enum.Material.SmoothPlastic })
	local scr = B.part(m, { Name = "Screen", Size = Vector3.new(1.7, 1.3, 0.05), CFrame = cf * CFrame.new(0, 1.4, -0.82), Color = Color3.fromRGB(60, 200, 140), Material = Enum.Material.Neon, Transparency = 0.3 })
	scr:SetAttribute("Static", true)
	local l = Instance.new("SurfaceLight"); l.Face = Enum.NormalId.Front; l.Range = 7; l.Brightness = 0.6; l.Color = scr.Color; l.Parent = scr
	B.part(m, { Size = Vector3.new(2.6, 0.4, 1.8), CFrame = cf * CFrame.new(0, 0.2, 0.2), Color = beige, Material = Enum.Material.SmoothPlastic })
	B.part(m, { Size = Vector3.new(2.2, 0.12, 0.8), CFrame = cf * CFrame.new(0, 0.06, -1.3), Color = beige, Material = Enum.Material.SmoothPlastic })
	return finish(m, body, parent)
end

function B.Microscope(parent, cf)
	local m = newBreakable("Microscope", cf)
	local base = B.part(m, { Name = "Base", Size = Vector3.new(1.0, 0.2, 1.3), CFrame = cf * CFrame.new(0, 0.1, 0), Color = Color3.fromRGB(30, 30, 34), Material = Enum.Material.Metal })
	B.part(m, { Size = Vector3.new(0.25, 1.4, 0.25), CFrame = cf * CFrame.new(0, 0.8, 0.45), Color = Color3.fromRGB(230, 230, 235), Material = Enum.Material.Metal })
	cyl(m, cf * CFrame.new(0, 1.35, 0.1) * CFrame.Angles(math.rad(-25), 0, 0), 1.0, 0.3, { Color = Color3.fromRGB(230, 230, 235), Material = Enum.Material.Metal })
	B.part(m, { Size = Vector3.new(0.8, 0.08, 0.7), CFrame = cf * CFrame.new(0, 0.7, -0.05), Color = Color3.fromRGB(30, 30, 34), Material = Enum.Material.Metal })
	return finish(m, base, parent)
end

function B.Trophy(parent, cf)
	local m = newBreakable("Trophy", cf)
	local gold = Color3.fromRGB(230, 184, 70)
	local base = B.part(m, { Name = "Base", Size = Vector3.new(0.9, 0.5, 0.9), CFrame = cf * CFrame.new(0, 0.25, 0), Color = Color3.fromRGB(40, 30, 24), Material = Enum.Material.Wood })
	cyl(m, cf * CFrame.new(0, 0.75, 0), 0.5, 0.25, { Color = gold, Material = Enum.Material.Metal, Reflectance = 0.2 })
	cyl(m, cf * CFrame.new(0, 1.3, 0), 0.8, 0.8, { Color = gold, Material = Enum.Material.Metal, Reflectance = 0.2 })
	for _, s in ipairs({ -1, 1 }) do B.part(m, { Size = Vector3.new(0.12, 0.5, 0.12), CFrame = cf * CFrame.new(s * 0.5, 1.35, 0), Color = gold, Material = Enum.Material.Metal }) end
	return finish(m, base, parent)
end

function B.Vending(parent, cf)
	local m = newBreakable("Vending", cf)
	local hue = math.random() < 0.5 and Color3.fromRGB(200, 40, 50) or Color3.fromRGB(40, 90, 190)
	local body = B.part(m, { Name = "Body", Size = Vector3.new(4, 7.4, 3), CFrame = cf * CFrame.new(0, 3.7, 0), Color = hue, Material = Enum.Material.SmoothPlastic })
	local glass = B.part(m, { Name = "Glass", Size = Vector3.new(2.6, 5.2, 0.1), CFrame = cf * CFrame.new(-0.5, 4.3, -1.52), Color = Color3.fromRGB(190, 230, 255), Material = Enum.Material.Glass, Transparency = 0.5 })
	for r = 0, 4 do for c = 0, 2 do
		B.part(m, { Size = Vector3.new(0.6, 0.7, 0.5), CFrame = cf * CFrame.new(-1.3 + c * 0.8, 2.2 + r * 1.0, -1.2), Color = Color3.fromHSV(math.random(), 0.7, 0.9), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end end
	local pan = B.part(m, { Name = "Panel", Size = Vector3.new(0.7, 2.0, 0.1), CFrame = cf * CFrame.new(1.4, 4.8, -1.52), Color = Color3.fromRGB(255, 240, 200), Material = Enum.Material.Neon, Transparency = 0.2 })
	local l = Instance.new("SurfaceLight"); l.Face = Enum.NormalId.Front; l.Range = 12; l.Brightness = 0.9; l.Color = Color3.fromRGB(220, 240, 255); l.Parent = glass
	B.part(m, { Size = Vector3.new(2.6, 0.8, 0.2), CFrame = cf * CFrame.new(-0.5, 0.9, -1.55), Color = Color3.fromRGB(20, 20, 22), Material = Enum.Material.SmoothPlastic })
	return finish(m, body, parent)
end

-- armário escolar estreito e colorido (também dá pra se esconder)
function B.SchoolLocker(parent, cf, color)
	local m = B.Locker(parent, cf)
	for _, p in ipairs(m:GetChildren()) do
		if p:IsA("BasePart") and p.Name ~= "HidePoint" and p.Name ~= "Slit" and p.Size.X < 3.9 and p.Name == "Door" then p.Color = color end
		if p:IsA("BasePart") and p.Name ~= "Door" and p.Name ~= "Slit" and p.Name ~= "HidePoint" and p.Size.Y > 7 then p.Color = color:Lerp(Color3.new(0, 0, 0), 0.25) end
	end
	return m
end

-- ===== Armario =====
function B.Locker(parent, cf)
	idCounter += 1
	local m = Instance.new("Model")
	m.Name = "Locker"
	m:SetAttribute("LId", "L" .. idCounter)
	CS:AddTag(m, "Locker")
	local metal = { Color = Color3.fromRGB(58,66,62), Material = Enum.Material.Metal }
	local function mt(t) for a, v in pairs(metal) do t[a] = v end return t end
	local back = B.part(m, mt({ Name = "Back", Size = Vector3.new(4,8,0.25), CFrame = cf * CFrame.new(0,4,1.6) }))
	B.part(m, mt({ Size = Vector3.new(0.25,8,3.4), CFrame = cf * CFrame.new(-2,4,0) }))
	B.part(m, mt({ Size = Vector3.new(0.25,8,3.4), CFrame = cf * CFrame.new(2,4,0) }))
	B.part(m, mt({ Size = Vector3.new(4.2,0.25,3.6), CFrame = cf * CFrame.new(0,8.1,0) }))
	B.part(m, mt({ Size = Vector3.new(4,0.25,3.4), CFrame = cf * CFrame.new(0,0.1,0) }))
	local door = B.part(m, { Name = "Door", Size = Vector3.new(3.8,7.8,0.2), CFrame = cf * CFrame.new(0,4,-1.65), Color = Color3.fromRGB(70,80,74), Material = Enum.Material.Metal })
	for i = 0, 4 do
		B.part(m, { Name = "Slit", Size = Vector3.new(2.6,0.12,0.05), CFrame = cf * CFrame.new(0,6.6 - i*0.35,-1.77), Color = Color3.fromRGB(5,5,5), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	B.part(m, { Size = Vector3.new(0.15,0.8,0.15), CFrame = cf * CFrame.new(1.5,4,-1.8), Color = Color3.fromRGB(150,150,150), Material = Enum.Material.Metal })
	local hide = B.part(m, { Name = "HidePoint", Size = Vector3.new(1,1,1), CFrame = cf * CFrame.new(0,3,0.3) * CFrame.Angles(0, math.pi, 0), Transparency = 1, CanCollide = false, CanQuery = false })
	local pp = Instance.new("ProximityPrompt")
	pp.Name = "HidePrompt"; pp.ActionText = "Esconder"; pp.ObjectText = "Armário"; pp.KeyboardKeyCode = Enum.KeyCode.E
	pp.HoldDuration = 0.25; pp.MaxActivationDistance = 7; pp.RequiresLineOfSight = false; pp.Style = Enum.ProximityPromptStyle.Custom
	pp.Parent = door
	m.PrimaryPart = back
	m.Parent = parent
	return m
end

-- ===== Decoração =====
function B.Table(parent, cf, size)
	size = size or Vector3.new(4,3,2.5)
	local f = Instance.new("Model"); f.Name = "Table"
	local wood = Color3.fromRGB(70,45,28)
	B.part(f, { Size = Vector3.new(size.X,0.3,size.Z), CFrame = cf * CFrame.new(0,size.Y,0), Color = wood, Material = Enum.Material.Wood })
	for _, o in ipairs({ {-1,-1},{1,-1},{-1,1},{1,1} }) do
		B.part(f, { Size = Vector3.new(0.3,size.Y,0.3), CFrame = cf * CFrame.new(o[1]*(size.X/2-0.3),size.Y/2,o[2]*(size.Z/2-0.3)), Color = wood, Material = Enum.Material.Wood })
	end
	f.Parent = parent
	return cf * CFrame.new(0, size.Y + 0.15, 0)
end

function B.Shelf(parent, cf)
	local f = Instance.new("Model"); f.Name = "Shelf"
	local wood = Color3.fromRGB(60,40,25)
	B.part(f, { Size = Vector3.new(8,10,0.3), CFrame = cf * CFrame.new(0,5,0.9), Color = wood, Material = Enum.Material.Wood })
	for i = 0, 4 do
		B.part(f, { Size = Vector3.new(8,0.25,2), CFrame = cf * CFrame.new(0,0.5 + i*2.3,0), Color = wood, Material = Enum.Material.Wood })
		if i < 4 then
			local x = -3.6
			while x < 3.4 do
				local w = 0.3 + math.random() * 0.4
				local h = 1.2 + math.random() * 0.8
				B.part(f, { Size = Vector3.new(w,h,1.4), CFrame = cf * CFrame.new(x + w/2,0.62 + i*2.3 + h/2,0) * CFrame.Angles(0,0,math.rad(math.random(-6,6))), Color = Color3.fromHSV(math.random(), 0.5, 0.25 + math.random()*0.2), Material = Enum.Material.Fabric, CanCollide = false })
				x += w + 0.05
			end
		end
	end
	B.part(f, { Size = Vector3.new(0.3,10,2), CFrame = cf * CFrame.new(-4,5,0), Color = wood, Material = Enum.Material.Wood })
	B.part(f, { Size = Vector3.new(0.3,10,2), CFrame = cf * CFrame.new(4,5,0), Color = wood, Material = Enum.Material.Wood })
	f.Parent = parent
end

function B.Painting(parent, cf)
	local f = Instance.new("Model"); f.Name = "Painting"
	B.part(f, { Size = Vector3.new(4.4,3.4,0.25), CFrame = cf, Color = Color3.fromRGB(60,45,20), Material = Enum.Material.Wood, CanCollide = false })
	B.part(f, { Size = Vector3.new(3.8,2.8,0.1), CFrame = cf * CFrame.new(0,0,-0.15), Color = Color3.fromHSV(math.random(), 0.35, 0.18), Material = Enum.Material.Fabric, CanCollide = false })
	-- silhueta com a faixa nos olhos
	B.part(f, { Shape = Enum.PartType.Ball, Size = Vector3.new(1.1,1.1,0.1), CFrame = cf * CFrame.new(0,0.35,-0.22), Color = Color3.fromRGB(15,12,10), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	B.part(f, { Size = Vector3.new(1.6,1.0,0.1), CFrame = cf * CFrame.new(0,-0.75,-0.22), Color = Color3.fromRGB(15,12,10), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	B.part(f, { Size = Vector3.new(1.2,0.18,0.12), CFrame = cf * CFrame.new(0,0.4,-0.26), Color = Color3.fromRGB(150,20,20), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	f.Parent = parent
end

function B.Rug(parent, cf, size, color)
	B.part(parent, { Name = "Rug", Size = Vector3.new(size.X, 0.08, size.Y), CFrame = cf * CFrame.new(0,0.04,0), Color = color, Material = Enum.Material.Fabric, CanCollide = false })
end

function B.CeilingLamp(parent, cf, flicker, brightness)
	local f = Instance.new("Model"); f.Name = "CeilingLamp"
	B.part(f, { Size = Vector3.new(0.1,3,0.1), CFrame = cf * CFrame.new(0,-1.5,0), Color = Color3.fromRGB(20,20,20), Material = Enum.Material.Metal, CanCollide = false })
	local bulb = B.part(f, { Name = "Bulb", Shape = Enum.PartType.Ball, Size = Vector3.new(0.8,0.8,0.8), CFrame = cf * CFrame.new(0,-3.2,0), Color = Color3.fromRGB(255,200,140), Material = Enum.Material.Neon, CanCollide = false })
	cyl(f, cf * CFrame.new(0,-2.8,0), 0.8, 2.2, { Color = Color3.fromRGB(30,28,24), Material = Enum.Material.Metal, CanCollide = false })
	local l = Instance.new("PointLight"); l.Range = 26; l.Brightness = brightness or 1.1; l.Color = Color3.fromRGB(255,185,120); l.Shadows = true; l.Parent = bulb
	if flicker then bulb:SetAttribute("Flicker", true) end
	CS:AddTag(bulb, "MapLight")
	f.Parent = parent
end

function B.ExitDoor(parent, cf)
	local m = Instance.new("Model"); m.Name = "ExitDoor"
	CS:AddTag(m, "ExitDoor")
	local door = B.part(m, { Name = "Door", Size = Vector3.new(8,9,0.6), CFrame = cf * CFrame.new(0,4.5,0), Color = Color3.fromRGB(45,30,22), Material = Enum.Material.WoodPlanks })
	B.part(m, { Size = Vector3.new(0.4,0.4,0.3), CFrame = cf * CFrame.new(3,4.5,-0.4), Color = Color3.fromRGB(170,150,90), Material = Enum.Material.Metal })
	local sign = B.part(m, { Name = "Sign", Size = Vector3.new(4,1,0.2), CFrame = cf * CFrame.new(0,10,-0.4), Color = Color3.fromRGB(120,10,10), Material = Enum.Material.Neon })
	local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front; sg.LightInfluence = 0; sg.CanvasSize = Vector2.new(400,100); sg.Parent = sign
	local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1,1); t.BackgroundTransparency = 1; t.Text = "SAÍDA"; t.Font = Enum.Font.Creepster; t.TextScaled = true; t.TextColor3 = Color3.fromRGB(255,220,220); t.Parent = sg
	local l = Instance.new("SurfaceLight"); l.Face = Enum.NormalId.Front; l.Color = Color3.fromRGB(255,40,40); l.Range = 14; l.Brightness = 1.2; l.Parent = sign
	local pp = Instance.new("ProximityPrompt")
	pp.Name = "ExitPrompt"; pp.ActionText = "Fugir"; pp.ObjectText = "Saída"; pp.HoldDuration = 2.5; pp.MaxActivationDistance = 8; pp.RequiresLineOfSight = false; pp.Enabled = false; pp.Style = Enum.ProximityPromptStyle.Custom
	pp.Parent = door
	m.PrimaryPart = door
	m.Parent = parent
	return m
end

-- =====================================================================
-- ANIMATRÔNICO v2: pelúcia rasgada, endoesqueleto aparecendo, fios, dentes
-- =====================================================================
function B.AnimatronicStatue(parent, cf, variant)
	local m = newBreakable("Animatronic", cf)
	local palette = {
		Bear = { fur = Color3.fromRGB(82, 52, 30), tan = Color3.fromRGB(150, 112, 74), acc = Color3.fromRGB(15, 15, 15) },
		Bunny = { fur = Color3.fromRGB(52, 60, 128), tan = Color3.fromRGB(120, 130, 190), acc = Color3.fromRGB(150, 20, 30) },
		Chicken = { fur = Color3.fromRGB(196, 160, 40), tan = Color3.fromRGB(220, 208, 170), acc = Color3.fromRGB(230, 110, 20) },
		Fox = { fur = Color3.fromRGB(130, 30, 22), tan = Color3.fromRGB(190, 150, 120), acc = Color3.fromRGB(60, 50, 40) },
	}
	local p = palette[variant] or palette.Bear
	local metal = Color3.fromRGB(92, 92, 98)
	local dirty = Enum.Material.Fabric
	local rnd = Random.new()
	local function fp(t) t.Material = t.Material or dirty; return B.part(m, t) end
	local function ball(t) t.Shape = Enum.PartType.Ball; return B.part(m, t) end
	local slump = rnd:NextNumber(-12, 12)
	local base = cf * CFrame.Angles(0, 0, math.rad(slump * 0.15))
	-- pernas com joelho de metal
	for _, s in ipairs({ -1, 1 }) do
		fp({ Size = Vector3.new(1.3, 1.8, 1.3), CFrame = base * CFrame.new(s * 0.85, 1.2, 0), Color = p.fur })
		ball({ Size = Vector3.new(0.7, 0.7, 0.7), CFrame = base * CFrame.new(s * 0.85, 2.3, -0.1), Color = metal, Material = Enum.Material.Metal })
		B.cyl(m, base * CFrame.new(s * 0.85, 3.1, 0) * CFrame.Angles(0, 0, math.rad(90)), 1.4, 0.35, { Color = metal, Material = Enum.Material.Metal })
		fp({ Size = Vector3.new(1.4, 1.4, 1.4), CFrame = base * CFrame.new(s * 0.85, 3.4, 0), Color = p.fur })
		fp({ Size = Vector3.new(1.5, 0.6, 2.1), CFrame = base * CFrame.new(s * 0.85, 0.3, -0.3), Color = p.fur })
	end
	local torso = fp({ Name = "Torso", Size = Vector3.new(3.4, 3.8, 2.4), CFrame = base * CFrame.new(0, 5.4, 0), Color = p.fur })
	fp({ Size = Vector3.new(2.3, 2.7, 0.2), CFrame = base * CFrame.new(0, 5.2, -1.22), Color = p.tan })
	-- buraco rasgado no peito com engrenagens e fios
	B.part(m, { Size = Vector3.new(1.1, 1.2, 0.22), CFrame = base * CFrame.new(rnd:NextNumber(-0.6, 0.6), 5.6, -1.3) * CFrame.Angles(0, 0, math.rad(rnd:NextNumber(-25, 25))), Color = Color3.fromRGB(8, 6, 6), Material = Enum.Material.SmoothPlastic })
	B.cyl(m, base * CFrame.new(0.1, 5.6, -1.35) * CFrame.Angles(0, math.rad(90), 0), 0.12, 0.8, { Color = Color3.fromRGB(120, 100, 60), Material = Enum.Material.Metal })
	for i = 1, 4 do
		local a = base * CFrame.new(rnd:NextNumber(-0.4, 0.4), 5.3, -1.38)
		B.part(m, { Size = Vector3.new(0.06, rnd:NextNumber(0.8, 1.8), 0.06), CFrame = a * CFrame.new(0, -0.6, 0) * CFrame.Angles(math.rad(rnd:NextNumber(-20, 20)), 0, math.rad(rnd:NextNumber(-25, 25))), Color = ({ Color3.fromRGB(160, 20, 20), Color3.fromRGB(20, 60, 160), Color3.fromRGB(200, 170, 30), Color3.fromRGB(20, 20, 20) })[i], Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	-- braços: um caído, outro esticado pra frente (como se fosse te agarrar)
	for _, s in ipairs({ -1, 1 }) do
		local reach = (s == 1) and math.rad(-55) or math.rad(5)
		local sh = base * CFrame.new(s * 2.2, 6.7, 0) * CFrame.Angles(reach, 0, s * math.rad(10))
		ball({ Size = Vector3.new(0.9, 0.9, 0.9), CFrame = sh, Color = metal, Material = Enum.Material.Metal })
		fp({ Size = Vector3.new(0.95, 1.8, 0.95), CFrame = sh * CFrame.new(0, -1.1, 0), Color = p.fur })
		B.cyl(m, sh * CFrame.new(0, -2.4, 0) * CFrame.Angles(0, 0, math.rad(90)), 1.0, 0.3, { Color = metal, Material = Enum.Material.Metal })
		fp({ Size = Vector3.new(0.85, 1.4, 0.85), CFrame = sh * CFrame.new(0, -3.4, 0), Color = p.fur })
		-- dedos de metal saindo da luva
		for f = -1, 1 do
			B.part(m, { Size = Vector3.new(0.12, 0.7, 0.12), CFrame = sh * CFrame.new(f * 0.22, -4.35, -0.1) * CFrame.Angles(math.rad(-15), 0, 0), Color = metal, Material = Enum.Material.Metal, CanCollide = false })
		end
	end
	-- pescoço exposto e cabeça caída de lado
	B.cyl(m, base * CFrame.new(0, 7.6, 0) * CFrame.Angles(0, 0, math.rad(90)), 0.9, 0.45, { Color = metal, Material = Enum.Material.Metal })
	local head = ball({ Name = "Head", Size = Vector3.new(2.7, 2.5, 2.5), CFrame = base * CFrame.new(0, 8.7, -0.15) * CFrame.Angles(math.rad(14), math.rad(rnd:NextNumber(-15, 15)), math.rad(slump)), Color = p.fur, Material = dirty })
	local hcf = head.CFrame
	ball({ Size = Vector3.new(1.5, 0.95, 1.0), CFrame = hcf * CFrame.new(0, -0.35, -1.0), Color = p.tan, Material = dirty })
	-- mandíbula aberta com dentes
	local jaw = B.part(m, { Name = "Jaw", Size = Vector3.new(1.6, 0.35, 1.2), CFrame = hcf * CFrame.new(0, -1.15, -0.8) * CFrame.Angles(math.rad(28), 0, 0), Color = p.tan, Material = dirty })
	B.part(m, { Size = Vector3.new(1.4, 0.6, 0.9), CFrame = hcf * CFrame.new(0, -0.85, -0.85), Color = Color3.fromRGB(10, 4, 4), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	for i = -3, 3 do
		B.part(m, { Size = Vector3.new(0.13, 0.22, 0.13), CFrame = hcf * CFrame.new(i * 0.19, -0.62, -1.28), Color = Color3.fromRGB(225, 215, 190), Material = Enum.Material.SmoothPlastic, CanCollide = false })
		B.part(m, { Size = Vector3.new(0.13, 0.2, 0.13), CFrame = jaw.CFrame * CFrame.new(i * 0.19, 0.25, -0.45), Color = Color3.fromRGB(205, 195, 170), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	-- olhos: órbitas fundas, pupilas que brilham (um olho de endoesqueleto vermelho)
	for _, s in ipairs({ -1, 1 }) do
		ball({ Size = Vector3.new(0.7, 0.7, 0.45), CFrame = hcf * CFrame.new(s * 0.52, 0.32, -1.02), Color = Color3.fromRGB(6, 6, 6), Material = Enum.Material.SmoothPlastic })
		local endo = (s == 1) and rnd:NextNumber() < 0.6
		local eye = ball({ Name = "Eye", Size = Vector3.new(0.2, 0.2, 0.12), CFrame = hcf * CFrame.new(s * 0.52, 0.32, -1.27), Color = endo and Color3.fromRGB(255, 30, 20) or Color3.fromRGB(235, 235, 220), Material = Enum.Material.Neon })
		if endo then local l = Instance.new("PointLight"); l.Range = 7; l.Brightness = 1.4; l.Color = Color3.fromRGB(255, 40, 30); l.Parent = eye end
		if variant == "Bunny" then
			fp({ Size = Vector3.new(0.5, 2.8, 0.3), CFrame = hcf * CFrame.new(s * 0.55, 2.3, 0.1) * CFrame.Angles(0, 0, s * math.rad(-10 - ((s == 1) and 35 or 0))), Color = p.fur })
		elseif variant == "Bear" or variant == "Fox" then
			ball({ Size = Vector3.new(0.8, 0.8, 0.4), CFrame = hcf * CFrame.new(s * 1.0, 1.05, 0.1), Color = p.fur, Material = dirty })
		end
	end
	-- metade do rosto sem pelúcia (crânio de metal)
	ball({ Size = Vector3.new(1.3, 1.5, 1.4), CFrame = hcf * CFrame.new(-0.75, 0.1, -0.55), Color = metal, Material = Enum.Material.DiamondPlate })
	if variant == "Chicken" then
		B.part(m, { Shape = Enum.PartType.Wedge, Size = Vector3.new(0.9, 0.5, 0.9), CFrame = hcf * CFrame.new(0, -0.3, -1.5) * CFrame.Angles(math.rad(90), 0, 0), Color = p.acc, Material = Enum.Material.SmoothPlastic })
		local bib = B.part(m, { Size = Vector3.new(2.4, 1.4, 0.1), CFrame = base * CFrame.new(0, 6.1, -1.3), Color = Color3.fromRGB(220, 215, 205), Material = Enum.Material.Fabric })
		local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front; sg.CanvasSize = Vector2.new(200, 100); sg.Parent = bib
		local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = 1; t.Text = "VAMOS COMER!"; t.Font = Enum.Font.Creepster; t.TextScaled = true; t.TextColor3 = Color3.fromRGB(120, 10, 10); t.Parent = sg
	elseif variant == "Bear" then
		B.cyl(m, hcf * CFrame.new(0, 1.4, 0), 0.9, 0.9, { Color = p.acc, Material = Enum.Material.SmoothPlastic })
		B.cyl(m, hcf * CFrame.new(0, 1.0, 0), 0.1, 1.5, { Color = p.acc, Material = Enum.Material.SmoothPlastic })
		ball({ Size = Vector3.new(0.6, 0.5, 0.3), CFrame = base * CFrame.new(0, 7.0, -1.2), Color = p.acc, Material = Enum.Material.SmoothPlastic })
	elseif variant == "Fox" then
		B.part(m, { Size = Vector3.new(0.9, 0.9, 0.12), CFrame = hcf * CFrame.new(0.55, 0.35, -1.25), Color = Color3.fromRGB(20, 20, 20), Material = Enum.Material.Fabric })
		B.part(m, { Size = Vector3.new(0.15, 1.6, 0.15), CFrame = base * CFrame.new(2.5, 3.0, -0.6) * CFrame.Angles(math.rad(-40), 0, 0), Color = Color3.fromRGB(180, 180, 185), Material = Enum.Material.Metal })
	end
	-- manchas escuras (óleo / sangue seco)
	for _ = 1, 3 do
		B.part(m, { Size = Vector3.new(rnd:NextNumber(0.4, 0.9), rnd:NextNumber(0.5, 1.4), 0.05), CFrame = base * CFrame.new(rnd:NextNumber(-1.2, 1.2), rnd:NextNumber(4, 6.5), -1.33), Color = Color3.fromRGB(55, 6, 6), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	return finish(m, torso, parent)
end

-- =====================================================================
-- GERADOR DE MAPAS GRANDES (para muitos jogadores)
-- Grade de células -> salas (algumas fundidas em salões) -> portas (árvore + laços)
-- =====================================================================
local CELL = 36
local WALL_H = 16
local DOOR_W = 9

local function sg(part, face, text, font, color, bg)
	local g = Instance.new("SurfaceGui"); g.Face = face or Enum.NormalId.Front; g.CanvasSize = Vector2.new(400, 200); g.LightInfluence = 1; g.Parent = part
	local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = bg and 0 or 1; t.BackgroundColor3 = bg or Color3.new(); t.Text = text; t.Font = font or Enum.Font.Creepster; t.TextScaled = true; t.TextColor3 = color or Color3.new(1, 1, 1); t.Parent = g
	return g
end

local THEMES = {
	Pizzeria = {
		name = "Pizzaria do Urso Feliz",
		w = 8, h = 6, seed = 1987,
		floorA = Color3.fromRGB(28, 26, 26), floorB = Color3.fromRGB(120, 116, 108), floorMat = Enum.Material.Marble,
		wall = Color3.fromRGB(58, 22, 34), wallMat = Enum.Material.Plaster, wains = Color3.fromRGB(26, 18, 18), stripe = Color3.fromRGB(150, 110, 20),
		ceil = Color3.fromRGB(30, 28, 30), lamp = Color3.fromRGB(255, 170, 110),
		big = {
			{ x = 3, y = 0, w = 2, h = 2, type = "Stage" },
			{ x = 3, y = 2, w = 2, h = 2, type = "Dining" },
			{ x = 0, y = 2, w = 2, h = 1, type = "Arcade" },
			{ x = 6, y = 3, w = 2, h = 1, type = "Kitchen" },
			{ x = 5, y = 0, w = 1, h = 3, type = "Hall" },
			{ x = 2, y = 0, w = 1, h = 3, type = "Hall" },
			{ x = 0, y = 4, w = 8, h = 1, type = "Hall" },
		},
		start = { x = 3, y = 3 },
		rooms = { "PartyRoom", "PartyRoom", "Office", "PartsService", "Storage", "Restroom", "Arcade", "Kitchen", "Storage", "PartyRoom" },
	},
	Mansion = {
		name = "Mansão Ravenhill",
		w = 8, h = 7, seed = 1893,
		floorA = Color3.fromRGB(56, 36, 24), floorB = Color3.fromRGB(48, 30, 20), floorMat = Enum.Material.WoodPlanks,
		wall = Color3.fromRGB(28, 38, 32), wallMat = Enum.Material.Fabric, wains = Color3.fromRGB(40, 24, 16), stripe = Color3.fromRGB(110, 86, 40),
		ceil = Color3.fromRGB(24, 20, 18), lamp = Color3.fromRGB(255, 160, 90),
		big = {
			{ x = 3, y = 2, w = 2, h = 3, type = "Ballroom" },
			{ x = 0, y = 3, w = 3, h = 1, type = "Hall" },
			{ x = 5, y = 3, w = 3, h = 1, type = "Hall" },
			{ x = 3, y = 0, w = 2, h = 2, type = "Dining" },
			{ x = 0, y = 0, w = 2, h = 1, type = "Library" },
			{ x = 6, y = 5, w = 2, h = 2, type = "Gallery" },
		},
		start = { x = 3, y = 4 },
		rooms = { "Bedroom", "Bedroom", "Study", "Library", "Gallery", "Bedroom", "Study", "Storage", "Bathroom", "Chapel" },
	},
	School = {
		name = "Colégio Santa Lúcia",
		w = 9, h = 6, seed = 2004,
		floorA = Color3.fromRGB(70, 74, 70), floorB = Color3.fromRGB(56, 60, 58), floorMat = Enum.Material.Slate,
		wall = Color3.fromRGB(70, 82, 74), wallMat = Enum.Material.Plaster, wains = Color3.fromRGB(40, 54, 50), stripe = Color3.fromRGB(120, 30, 30),
		ceil = Color3.fromRGB(46, 46, 44), lamp = Color3.fromRGB(200, 230, 255),
		big = {
			{ x = 0, y = 2, w = 9, h = 1, type = "Corridor" },
			{ x = 4, y = 0, w = 1, h = 2, type = "Corridor" },
			{ x = 4, y = 3, w = 1, h = 3, type = "Corridor" },
			{ x = 6, y = 3, w = 3, h = 2, type = "Gym" },
			{ x = 0, y = 3, w = 2, h = 2, type = "Cafeteria" },
		},
		start = { x = 4, y = 2 },
		rooms = { "Classroom", "Classroom", "Classroom", "Lab", "Classroom", "Library", "Office", "Restroom", "Classroom", "Lab", "Storage" },
	},
}
B.MapThemes = THEMES

local function wallPart(f, a: Vector3, b: Vector3, y0: number, y1: number, th)
	local d = b - a
	local len = d.Magnitude
	if len < 0.3 then return end
	local mid = (a + b) / 2
	local cf = CFrame.lookAt(Vector3.new(mid.X, (y0 + y1) / 2, mid.Z), Vector3.new(b.X, (y0 + y1) / 2, b.Z))
	local w = B.part(f, { Name = "Wall", Size = Vector3.new(1, y1 - y0, len), CFrame = cf, Color = th.wall, Material = th.wallMat })
	if y0 < 1 then
		-- rodapé / lambri + faixa
		B.part(f, { Name = "Wainscot", Size = Vector3.new(1.3, 4, len), CFrame = cf * CFrame.new(0, -((y1 - y0) / 2) + 2, 0), Color = th.wains, Material = Enum.Material.Wood })
		B.part(f, { Name = "Stripe", Size = Vector3.new(1.4, 0.35, len), CFrame = cf * CFrame.new(0, -((y1 - y0) / 2) + 4.1, 0), Color = th.stripe, Material = Enum.Material.SmoothPlastic })
	end
	return w
end

local function decal(f, cf, size, color, trans)
	return B.part(f, { Name = "Grime", Size = size, CFrame = cf, Color = color, Material = Enum.Material.SmoothPlastic, Transparency = trans or 0, CanCollide = false, CanQuery = false, CastShadow = false })
end

function B.BuildMap(themeId: string)
	local th = THEMES[themeId]
	local rnd = Random.new(th.seed)
	local W, H = th.w, th.h
	local map = Instance.new("Model"); map.Name = themeId
	map:SetAttribute("MapName", th.name)
	local F = {}
	for _, n in ipairs({ "Structure", "Breakables", "Lockers", "Lights", "Props", "Spawns", "Exits" }) do
		local f = Instance.new("Folder"); f.Name = n; f.Parent = map; F[n] = f
	end
	local ox, oz = -W * CELL / 2, -H * CELL / 2
	local function cellCenter(x, y) return Vector3.new(ox + (x + 0.5) * CELL, 0, oz + (y + 0.5) * CELL) end

	-- ===== salas =====
	local roomOf = {}
	local rooms = {}
	local function addRoom(x, y, w, h, typ)
		local r = { x = x, y = y, w = w, h = h, type = typ, id = #rooms + 1, doors = {} }
		table.insert(rooms, r)
		for i = x, x + w - 1 do for j = y, y + h - 1 do roomOf[i .. "," .. j] = r end end
		return r
	end
	for _, b in ipairs(th.big) do
		local free = true
		for i = b.x, b.x + b.w - 1 do for j = b.y, b.y + b.h - 1 do if roomOf[i .. "," .. j] then free = false end end end
		if free then addRoom(b.x, b.y, b.w, b.h, b.type) end
	end
	local pool = th.rooms
	local k = 0
	for j = 0, H - 1 do
		for i = 0, W - 1 do
			if not roomOf[i .. "," .. j] then
				-- às vezes funde duas células livres numa sala 2x1
				k += 1
				local typ = pool[rnd:NextInteger(1, #pool)]
				if i + 1 < W and not roomOf[(i + 1) .. "," .. j] and rnd:NextNumber() < 0.3 then addRoom(i, j, 2, 1, typ)
				else addRoom(i, j, 1, 1, typ) end
			end
		end
	end
	local function roomCenter(r) return Vector3.new(ox + (r.x + r.w / 2) * CELL, 0, oz + (r.y + r.h / 2) * CELL) end

	-- ===== conexões entre salas =====
	-- lista de fronteiras entre células de salas diferentes
	local edges = {}
	local function addEdge(a, b, segA, segB)
		local key = math.min(a.id, b.id) .. "-" .. math.max(a.id, b.id)
		edges[key] = edges[key] or { a = a, b = b, segs = {} }
		table.insert(edges[key].segs, { segA, segB })
	end
	local walls = {} -- segmentos de parede: {a, b, door = center or nil}
	for j = 0, H - 1 do
		for i = 0, W - 1 do
			local r = roomOf[i .. "," .. j]
			local x0, z0 = ox + i * CELL, oz + j * CELL
			-- parede leste
			if i + 1 < W then
				local r2 = roomOf[(i + 1) .. "," .. j]
				if r2 ~= r then
					local seg = { Vector3.new(x0 + CELL, 0, z0), Vector3.new(x0 + CELL, 0, z0 + CELL) }
					table.insert(walls, seg); addEdge(r, r2, seg)
				end
			else table.insert(walls, { Vector3.new(x0 + CELL, 0, z0), Vector3.new(x0 + CELL, 0, z0 + CELL), outer = Vector3.new(-1, 0, 0) }) end
			if i == 0 then table.insert(walls, { Vector3.new(x0, 0, z0), Vector3.new(x0, 0, z0 + CELL), outer = Vector3.new(1, 0, 0) }) end
			-- parede sul
			if j + 1 < H then
				local r2 = roomOf[i .. "," .. (j + 1)]
				if r2 ~= r then
					local seg = { Vector3.new(x0, 0, z0 + CELL), Vector3.new(x0 + CELL, 0, z0 + CELL) }
					table.insert(walls, seg); addEdge(r, r2, seg)
				end
			else table.insert(walls, { Vector3.new(x0, 0, z0 + CELL), Vector3.new(x0 + CELL, 0, z0 + CELL), outer = Vector3.new(0, 0, -1) }) end
			if j == 0 then table.insert(walls, { Vector3.new(x0, 0, z0), Vector3.new(x0 + CELL, 0, z0), outer = Vector3.new(0, 0, 1) }) end
		end
	end
	-- árvore geradora (Kruskal aleatório) + 35% de laços extras para fugir em círculos
	local elist = {}
	for _, e in pairs(edges) do table.insert(elist, e) end
	table.sort(elist, function(a, b) return (a.a.id * 1000 + a.b.id) < (b.a.id * 1000 + b.b.id) end)
	for i = #elist, 2, -1 do local j = rnd:NextInteger(1, i); elist[i], elist[j] = elist[j], elist[i] end
	local parent = {}
	local function find(x) while parent[x] and parent[x] ~= x do x = parent[x] end return x end
	for _, e in ipairs(elist) do
		local ra, rb = find(e.a.id), find(e.b.id)
		local hall = e.a.type == "Hall" or e.b.type == "Hall" or e.a.type == "Corridor" or e.b.type == "Corridor"
		if ra ~= rb or rnd:NextNumber() < (hall and 0.6 or 0.3) then
			parent[ra] = rb
			-- porta em 1 (ou 2, se fronteira longa) segmentos
			local n = (#e.segs >= 3 and hall) and 2 or 1
			for c = 1, n do
				local seg = e.segs[rnd:NextInteger(1, #e.segs)]
				seg.door = true
			end
		end
	end

	-- ===== construção das paredes =====
	local doorCenters = {}
	for _, seg in ipairs(walls) do
		local a, b = seg[1], seg[2]
		if seg.door then
			local dir = (b - a).Unit
			local off = rnd:NextNumber(-6, 6)
			local c = (a + b) / 2 + dir * off
			table.insert(doorCenters, c)
			wallPart(F.Structure, a, c - dir * DOOR_W / 2, 0, WALL_H, th)
			wallPart(F.Structure, c + dir * DOOR_W / 2, b, 0, WALL_H, th)
			wallPart(F.Structure, c - dir * DOOR_W / 2, c + dir * DOOR_W / 2, 11, WALL_H, th)
			-- batente
			local cf = CFrame.lookAt(c + Vector3.new(0, 5.5, 0), c + Vector3.new(0, 5.5, 0) + dir)
			B.part(F.Structure, { Name = "Frame", Size = Vector3.new(1.6, 0.6, DOOR_W + 1), CFrame = cf * CFrame.new(0, 5.2, 0), Color = th.wains, Material = Enum.Material.Wood })
		else
			wallPart(F.Structure, a, b, 0, WALL_H, th)
		end
		seg.wallDir = seg.outer
	end
	local function nearDoor(p: Vector3, r: number)
		for _, c in ipairs(doorCenters) do if (Vector3.new(p.X, 0, p.Z) - c).Magnitude < r then return true end end
		return false
	end

	-- ===== piso (ladrilhos) e teto =====
	local TILE = 9
	for j = 0, H - 1 do
		for i = 0, W - 1 do
			local x0, z0 = ox + i * CELL, oz + j * CELL
			for a = 0, CELL / TILE - 1 do
				for b2 = 0, CELL / TILE - 1 do
					local alt = ((i * 4 + a) + (j * 4 + b2)) % 2 == 0
					local c = alt and th.floorA or th.floorB
					local v = rnd:NextNumber(-0.04, 0.04)
					c = Color3.new(math.clamp(c.R + v, 0, 1), math.clamp(c.G + v, 0, 1), math.clamp(c.B + v, 0, 1))
					B.part(F.Structure, { Name = "Floor", Size = Vector3.new(TILE, 1, TILE), CFrame = CFrame.new(x0 + (a + 0.5) * TILE, -0.5, z0 + (b2 + 0.5) * TILE), Color = c, Material = th.floorMat })
				end
			end
			B.part(F.Structure, { Name = "Ceiling", Size = Vector3.new(CELL, 1, CELL), CFrame = CFrame.new(x0 + CELL / 2, WALL_H + 0.5, z0 + CELL / 2), Color = th.ceil, Material = Enum.Material.Concrete })
		end
	end

	-- ===== iluminação: pouca, fraca, piscando =====
	for _, r in ipairs(rooms) do
		local n = math.max(1, math.floor(r.w * r.h * 0.7))
		for q = 1, n do
			if rnd:NextNumber() < 0.62 then
				local cx = ox + (r.x + rnd:NextNumber(0.25, r.w - 0.25)) * CELL
				local cz = oz + (r.y + rnd:NextNumber(0.25, r.h - 0.25)) * CELL
				B.CeilingLamp(F.Lights, CFrame.new(cx, WALL_H, cz), rnd:NextNumber() < 0.55, rnd:NextNumber(0.35, 0.75))
			end
		end
	end
	for _, bulb in ipairs(F.Lights:GetDescendants()) do
		if bulb:IsA("PointLight") then bulb.Color = th.lamp; bulb.Range = 22 end
	end

	-- ===== pontos de colocação =====
	local function wallSpots(r, inset)
		-- pontos encostados nas paredes, virados para dentro da sala
		local spots = {}
		local x0, z0 = ox + r.x * CELL, oz + r.y * CELL
		local x1, z1 = x0 + r.w * CELL, z0 + r.h * CELL
		local step = 6
		for x = x0 + 5, x1 - 5, step do
			table.insert(spots, CFrame.lookAt(Vector3.new(x, 0, z0 + inset), Vector3.new(x, 0, z0 + inset + 1)))
			table.insert(spots, CFrame.lookAt(Vector3.new(x, 0, z1 - inset), Vector3.new(x, 0, z1 - inset - 1)))
		end
		for z = z0 + 5, z1 - 5, step do
			table.insert(spots, CFrame.lookAt(Vector3.new(x0 + inset, 0, z), Vector3.new(x0 + inset + 1, 0, z)))
			table.insert(spots, CFrame.lookAt(Vector3.new(x1 - inset, 0, z), Vector3.new(x1 - inset - 1, 0, z)))
		end
		local out = {}
		for _, s in ipairs(spots) do if not nearDoor(s.Position, 8) then table.insert(out, s) end end
		for i = #out, 2, -1 do local j = rnd:NextInteger(1, i); out[i], out[j] = out[j], out[i] end
		return out
	end
	local function floorSpots(r)
		local spots = {}
		local x0, z0 = ox + r.x * CELL, oz + r.y * CELL
		for x = x0 + 9, x0 + r.w * CELL - 9, 7 do
			for z = z0 + 9, z0 + r.h * CELL - 9, 7 do
				local p = Vector3.new(x + rnd:NextNumber(-1, 1), 0, z + rnd:NextNumber(-1, 1))
				if not nearDoor(p, 7) then table.insert(spots, CFrame.new(p) * CFrame.Angles(0, rnd:NextNumber(0, math.pi * 2), 0)) end
			end
		end
		for i = #spots, 2, -1 do local j = rnd:NextInteger(1, i); spots[i], spots[j] = spots[j], spots[i] end
		return spots
	end
	local function take(list) return table.remove(list) end

	local bandageSpots = {}
	local function bandageAt(p: Vector3)
		local s = B.part(F.Spawns, { Name = "BandageSpawn", Size = Vector3.new(1, 1, 1), CFrame = CFrame.new(p + Vector3.new(0, 0.5, 0)), Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })
		table.insert(bandageSpots, s)
	end

	-- ===== mobília por tipo de sala =====
	local function stage(r)
		local c = roomCenter(r)
		local z0 = oz + r.y * CELL
		local stageCF = CFrame.new(c.X, 0, z0 + 12)
		B.part(F.Props, { Name = "Stage", Size = Vector3.new(r.w * CELL - 10, 3, 20), CFrame = stageCF * CFrame.new(0, 1.5, -1), Color = Color3.fromRGB(40, 20, 14), Material = Enum.Material.WoodPlanks })
		B.part(F.Props, { Name = "StageTrim", Size = Vector3.new(r.w * CELL - 9.6, 0.5, 0.6), CFrame = stageCF * CFrame.new(0, 3, 9), Color = th.stripe, Material = Enum.Material.Metal })
		-- cortinas roxas rasgadas
		for side = -1, 1, 2 do
			for q = 0, 4 do
				B.part(F.Props, { Name = "Curtain", Size = Vector3.new(2.4, WALL_H - 3.4 - (q % 2) * 1.5, 0.5), CFrame = stageCF * CFrame.new(side * (r.w * CELL / 2 - 7 - q * 2.2), 3 + (WALL_H - 3.4 - (q % 2) * 1.5) / 2 + (q % 2) * 1.5, 6 + (q % 2) * 0.4), Color = Color3.fromRGB(56, 14, 48), Material = Enum.Material.Fabric, CanCollide = false })
			end
		end
		local banner = B.part(F.Props, { Name = "Banner", Size = Vector3.new(30, 4, 0.3), CFrame = stageCF * CFrame.new(0, WALL_H - 3, -10.5) * CFrame.Angles(0, math.pi, 0), Color = Color3.fromRGB(20, 10, 10), Material = Enum.Material.Fabric })
		sg(banner, Enum.NormalId.Front, "★ O SHOW NUNCA PARA ★", Enum.Font.Creepster, Color3.fromRGB(230, 170, 40))
		local vars = { "Bunny", "Bear", "Chicken" }
		for i, v in ipairs(vars) do
			B.AnimatronicStatue(F.Breakables, stageCF * CFrame.new((i - 2) * 9, 3, -2) * CFrame.Angles(0, math.pi + math.rad(rnd:NextNumber(-25, 25)), 0), v)
		end
		-- holofotes vermelhos fracos apontando para o palco
		for i = -1, 1 do
			local hp = B.part(F.Lights, { Name = "Spot", Size = Vector3.new(1.2, 1.2, 2), CFrame = CFrame.lookAt(stageCF.Position + Vector3.new(i * 12, WALL_H - 1.5, 18), stageCF.Position + Vector3.new(i * 9, 5, -2)), Color = Color3.fromRGB(20, 20, 20), Material = Enum.Material.Metal, CanCollide = false })
			local sl = Instance.new("SpotLight"); sl.Face = Enum.NormalId.Front; sl.Angle = 40; sl.Range = 34; sl.Brightness = 1.6; sl.Color = Color3.fromRGB(255, 60, 40); sl.Shadows = true; sl.Parent = hp
			hp:SetAttribute("Flicker", true); CS:AddTag(hp, "MapLight")
		end
		-- cortina lateral: "Enseada do Pirata"
		local cove = B.part(F.Props, { Name = "CoveSign", Size = Vector3.new(8, 2, 0.3), CFrame = CFrame.new(ox + (r.x + r.w) * CELL - 1, 9, z0 + 26) * CFrame.Angles(0, -math.pi / 2, 0), Color = Color3.fromRGB(15, 10, 10), Material = Enum.Material.Wood })
		sg(cove, Enum.NormalId.Front, "ENSEADA DO PIRATA — FORA DE SERVIÇO", Enum.Font.Fondamento, Color3.fromRGB(200, 180, 140))
	end

	local function pizzaRoom(r, spots, floors)
		local t = r.type
		if t == "Stage" then stage(r); return end
		if t == "Dining" or t == "PartyRoom" then
			local n = (t == "Dining") and 8 or 2
			for _ = 1, n do
				local cf = take(floors); if not cf then break end
				B.Table(F.Props, cf, Vector3.new(10, 3, 4))
				local cloth = B.part(F.Props, { Name = "Tablecloth", Size = Vector3.new(10.4, 0.1, 4.4), CFrame = cf * CFrame.new(0, 3.05, 0), Color = Color3.fromRGB(200, 196, 190), Material = Enum.Material.Fabric, CanCollide = false })
				for s = -1, 1, 2 do
					B.part(F.Props, { Name = "PartyHat", Shape = Enum.PartType.Wedge, Size = Vector3.new(0.5, 0.8, 0.5), CFrame = cf * CFrame.new(s * 3, 3.5, 0), Color = ({ Color3.fromRGB(200, 40, 60), Color3.fromRGB(40, 120, 200), Color3.fromRGB(230, 200, 40) })[rnd:NextInteger(1, 3)], Material = Enum.Material.SmoothPlastic, CanCollide = false })
					B.Chair(F.Breakables, cf * CFrame.new(s * 2.5, 0, 3.6) * CFrame.Angles(0, math.pi, 0))
				end
				if rnd:NextNumber() < 0.6 then B.Plush(F.Breakables, cf * CFrame.new(rnd:NextNumber(-3, 3), 3.1, 0)) end
				if rnd:NextNumber() < 0.3 then decal(F.Props, cf * CFrame.new(0, 3.12, 0.5), Vector3.new(1.6, 0.02, 2.2), Color3.fromRGB(80, 6, 8)) end
			end
			-- desenhos de criança na parede
			for _ = 1, 3 do
				local s = take(spots); if not s then break end
				local d = B.part(F.Props, { Name = "Drawing", Size = Vector3.new(2.4, 1.8, 0.1), CFrame = s * CFrame.new(0, 6.5, 1.8), Color = Color3.fromRGB(236, 232, 220), Material = Enum.Material.SmoothPlastic, CanCollide = false })
				sg(d, Enum.NormalId.Front, ({ "ME AJUDA", "ele me olha", "SORRIA", "5 crianças", "não é fantasia", "ELE VOLTOU" })[rnd:NextInteger(1, 6)], Enum.Font.PermanentMarker, Color3.fromRGB(150, 20, 20))
			end
			if t == "PartyRoom" then
				local s = take(spots); if s then B.AnimatronicStatue(F.Breakables, s * CFrame.new(0, 0, 1), ({ "Fox", "Bunny", "Chicken" })[rnd:NextInteger(1, 3)]) end
			end
		elseif t == "Arcade" then
			for _ = 1, 4 + r.w * 2 do local s = take(spots); if not s then break end; B.Arcade(F.Breakables, s * CFrame.new(0, 0, 0.5)) end
			for _ = 1, 3 do local cf = take(floors); if cf then B.Plush(F.Breakables, cf) end end
		elseif t == "Kitchen" then
			for _ = 1, 2 + r.w do local s = take(spots); if not s then break end; B.Oven(F.Breakables, s * CFrame.new(0, 0, 0.5)) end
			for _ = 1, 2 do local cf = take(floors); if cf then B.Table(F.Props, cf, Vector3.new(8, 3.4, 3)) end end
		elseif t == "Office" then
			local cf = take(floors)
			if cf then
				B.Table(F.Props, cf, Vector3.new(8, 3, 3.5))
				B.TV(F.Breakables, cf * CFrame.new(-2, 3, 0)); B.TV(F.Breakables, cf * CFrame.new(2, 3, 0))
			end
			local s = take(spots); if s then B.Safe(F.Breakables, s * CFrame.new(0, 0, 0.5)) end
			local p = B.part(F.Props, { Name = "Poster", Size = Vector3.new(4, 3, 0.1), CFrame = (take(spots) or CFrame.new(roomCenter(r))) * CFrame.new(0, 7, 1.8), Color = Color3.fromRGB(30, 20, 20), Material = Enum.Material.SmoothPlastic, CanCollide = false })
			sg(p, Enum.NormalId.Front, "TURNO DA NOITE: 00h — 06h", Enum.Font.SpecialElite, Color3.fromRGB(220, 200, 160))
		elseif t == "PartsService" then
			for _ = 1, 3 do local s = take(spots); if s then B.AnimatronicStatue(F.Breakables, s * CFrame.new(0, 0, 1), ({ "Bear", "Bunny", "Chicken", "Fox" })[rnd:NextInteger(1, 4)]) end end
			for _ = 1, 2 do local s = take(spots); if s then B.Shelf(F.Props, s * CFrame.new(0, 0, 0.5)) end end
		elseif t == "Restroom" or t == "Storage" then
			for _ = 1, 3 do local s = take(spots); if s then B.Shelf(F.Props, s * CFrame.new(0, 0, 0.5)) end end
			for _ = 1, 3 do local cf = take(floors); if cf then B.part(F.Props, { Name = "Crate", Size = Vector3.new(3, 3, 3), CFrame = cf * CFrame.new(0, 1.5, 0), Color = Color3.fromRGB(60, 44, 30), Material = Enum.Material.WoodPlanks }) end end
			local cf = take(floors); if cf then B.Plush(F.Breakables, cf) end
		elseif t == "Hall" then
			for _ = 1, 2 do local cf = take(floors); if cf then B.Plush(F.Breakables, cf) end end
		end
	end

	local function mansionRoom(r, spots, floors)
		local t = r.type
		if t == "Ballroom" then
			local c = roomCenter(r)
			B.Piano(F.Breakables, CFrame.new(c + Vector3.new(0, 0, -20)))
			B.Rug(F.Props, CFrame.new(c), Vector3.new(30, 50, 0), Color3.fromRGB(70, 10, 14))
			for _ = 1, 4 do local s = take(spots); if s then B.Statue(F.Breakables, s * CFrame.new(0, 0, 1)) end end
			for _ = 1, 4 do local cf = take(floors); if cf then B.Chair(F.Breakables, cf) end end
			-- lustre gigante quebrado
			B.CeilingLamp(F.Lights, CFrame.new(c.X, WALL_H, c.Z), true, 0.9)
		elseif t == "Dining" then
			local c = roomCenter(r)
			B.Table(F.Props, CFrame.new(c), Vector3.new(26, 3.2, 6))
			for i = -2, 2 do
				for s = -1, 1, 2 do B.Chair(F.Breakables, CFrame.new(c + Vector3.new(i * 5, 0, s * 5)) * CFrame.Angles(0, s == 1 and math.pi or 0, 0)) end
				if rnd:NextNumber() < 0.6 then B.Vase(F.Breakables, CFrame.new(c + Vector3.new(i * 5, 3.2, 0))) end
			end
		elseif t == "Library" then
			for _ = 1, 6 + r.w * 2 do local s = take(spots); if s then B.Shelf(F.Props, s * CFrame.new(0, 0, 0.5)) end end
			for _ = 1, 2 do local cf = take(floors); if cf then B.Lamp(F.Breakables, cf) end end
		elseif t == "Bedroom" then
			local s = take(spots); if s then B.Table(F.Props, s * CFrame.new(0, 0, 4), Vector3.new(6, 2.2, 8)) end
			for _ = 1, 2 do local s2 = take(spots); if s2 then B.Lamp(F.Breakables, s2) end end
			local cf = take(floors); if cf then B.Vase(F.Breakables, cf) end
			local s3 = take(spots); if s3 then B.Painting(F.Props, s3 * CFrame.new(0, 7, 1.65)) end
		elseif t == "Study" then
			local cf = take(floors); if cf then B.Table(F.Props, cf, Vector3.new(7, 3, 3.5)); B.TV(F.Breakables, cf * CFrame.new(0, 3, 0)) end
			local s = take(spots); if s then B.Safe(F.Breakables, s * CFrame.new(0, 0, 0.5)) end
			local s2 = take(spots); if s2 then B.Shelf(F.Props, s2 * CFrame.new(0, 0, 0.5)) end
		elseif t == "Gallery" then
			for _ = 1, 4 do local s = take(spots); if s then B.Painting(F.Props, s * CFrame.new(0, 7, 1.65)) end end
			for _ = 1, 3 do local cf = take(floors); if cf then B.Statue(F.Breakables, cf) end end
		elseif t == "Chapel" then
			local c = roomCenter(r)
			for i = -1, 1 do B.Table(F.Props, CFrame.new(c + Vector3.new(0, 0, i * 7)), Vector3.new(14, 2, 2)) end
			local cr = B.part(F.Props, { Name = "Cross", Size = Vector3.new(0.6, 6, 0.6), CFrame = CFrame.new(c + Vector3.new(0, 7, -14)) * CFrame.Angles(0, 0, math.pi), Color = Color3.fromRGB(60, 40, 30), Material = Enum.Material.Wood })
			B.part(F.Props, { Size = Vector3.new(3, 0.6, 0.6), CFrame = cr.CFrame * CFrame.new(0, -1, 0), Color = Color3.fromRGB(60, 40, 30), Material = Enum.Material.Wood })
			for i = 1, 6 do
				local cnd = B.part(F.Props, { Name = "Candle", Size = Vector3.new(0.3, 0.8, 0.3), CFrame = CFrame.new(c + Vector3.new(-5 + i * 1.6, 2.4, -12)), Color = Color3.fromRGB(230, 220, 200), Material = Enum.Material.SmoothPlastic })
				local fl = Instance.new("PointLight"); fl.Range = 7; fl.Brightness = 0.6; fl.Color = Color3.fromRGB(255, 150, 60); fl.Parent = cnd
				cnd:SetAttribute("Flicker", true); CS:AddTag(cnd, "MapLight")
			end
			B.Statue(F.Breakables, CFrame.new(c + Vector3.new(10, 0, -12)))
		elseif t == "Bathroom" or t == "Storage" then
			for _ = 1, 2 do local s = take(spots); if s then B.Shelf(F.Props, s * CFrame.new(0, 0, 0.5)) end end
			local cf = take(floors); if cf then B.Vase(F.Breakables, cf) end
		elseif t == "Hall" then
			for _ = 1, 3 do local s = take(spots); if s then B.Painting(F.Props, s * CFrame.new(0, 7, 1.65)) end end
			for _ = 1, 2 do local s = take(spots); if s then B.Vase(F.Breakables, s * CFrame.new(0, 0, 1)) end end
		end
	end

	local function schoolRoom(r, spots, floors)
		local t = r.type
		if t == "Classroom" then
			local c = roomCenter(r)
			for i = -1, 1 do for j = -1, 1 do
				local p = c + Vector3.new(i * 7, 0, j * 7 + 2)
				if not nearDoor(p, 6) then B.Desk(F.Breakables, CFrame.new(p) * CFrame.Angles(0, math.pi, 0)) end
			end end
			local s = take(spots); if s then B.Globe(F.Breakables, s * CFrame.new(0, 0, 2)) end
			local bd = B.part(F.Props, { Name = "Board", Size = Vector3.new(14, 6, 0.2), CFrame = CFrame.new(c.X, 7, oz + r.y * CELL + 0.8), Color = Color3.fromRGB(20, 36, 28), Material = Enum.Material.Slate, CanCollide = false })
			sg(bd, Enum.NormalId.Back, ({ "NÃO OLHE PARA TRÁS", "Aula 3: silêncio", "ele escuta tudo", "FIQUE NO ARMÁRIO", "chamada: 31 faltas" })[rnd:NextInteger(1, 5)], Enum.Font.PermanentMarker, Color3.fromRGB(220, 220, 210))
		elseif t == "Lab" then
			for _ = 1, 3 do local cf = take(floors); if cf then B.Table(F.Props, cf, Vector3.new(8, 3.2, 3)); B.Microscope(F.Breakables, cf * CFrame.new(-2, 3.2, 0)) end end
			local s = take(spots); if s then B.Computer(F.Breakables, s * CFrame.new(0, 0, 1)) end
		elseif t == "Library" then
			for _ = 1, 6 do local s = take(spots); if s then B.Shelf(F.Props, s * CFrame.new(0, 0, 0.5)) end end
			local cf = take(floors); if cf then B.Globe(F.Breakables, cf) end
		elseif t == "Office" then
			local cf = take(floors); if cf then B.Table(F.Props, cf, Vector3.new(7, 3, 3.5)); B.Computer(F.Breakables, cf * CFrame.new(0, 3, 0)) end
			local s = take(spots); if s then B.Trophy(F.Breakables, s * CFrame.new(0, 0, 1)) end
			local s2 = take(spots); if s2 then B.Safe(F.Breakables, s2 * CFrame.new(0, 0, 0.5)) end
		elseif t == "Gym" then
			for _ = 1, 4 do local s = take(spots); if s then B.Trophy(F.Breakables, s * CFrame.new(0, 0, 1)) end end
			local c = roomCenter(r)
			B.part(F.Props, { Name = "CourtLine", Size = Vector3.new(0.4, 0.05, r.h * CELL - 10), CFrame = CFrame.new(c + Vector3.new(0, 0.03, 0)), Color = Color3.fromRGB(160, 140, 60), Material = Enum.Material.SmoothPlastic, CanCollide = false })
		elseif t == "Cafeteria" then
			for _ = 1, 5 do local cf = take(floors); if cf then B.Table(F.Props, cf, Vector3.new(10, 3, 3.5)) end end
			for _ = 1, 3 do local s = take(spots); if s then B.Vending(F.Breakables, s * CFrame.new(0, 0, 0.5)) end end
		elseif t == "Corridor" then
			-- fileiras de armários escolares (escondem gente!)
			for _ = 1, 2 do local cf = take(floors); if cf then B.Trophy(F.Breakables, cf) end end
		elseif t == "Restroom" or t == "Storage" then
			for _ = 1, 3 do local s = take(spots); if s then B.Shelf(F.Props, s * CFrame.new(0, 0, 0.5)) end end
		end
	end

	local furnish = (themeId == "Pizzeria" and pizzaRoom) or (themeId == "Mansion" and mansionRoom) or schoolRoom
	local startRoom = roomOf[th.start.x .. "," .. th.start.y]
	local lockerCount = 0
	for _, r in ipairs(rooms) do
		local spots = wallSpots(r, 2.4)
		local floors = floorSpots(r)
		-- armários: 1–3 por sala (salas grandes têm mais)
		local nl = (r == startRoom) and 0 or math.clamp(math.floor(r.w * r.h * 0.9 + rnd:NextNumber(0.4, 1.4)), 1, 4)
		if r.type == "Corridor" then nl = r.w * r.h end
		for _ = 1, nl do
			local s = take(spots)
			if s then
				lockerCount += 1
				local cf = s * CFrame.new(0, 0, -0.4)
				if themeId == "School" then B.SchoolLocker(F.Lockers, cf, ({ Color3.fromRGB(120, 30, 30), Color3.fromRGB(30, 60, 110), Color3.fromRGB(40, 80, 50) })[rnd:NextInteger(1, 3)])
				else B.Locker(F.Lockers, cf) end
			end
		end
		if r ~= startRoom then pcall(furnish, r, spots, floors) end
		-- ataduras / lanternas escondidas
		if rnd:NextNumber() < 0.55 and #floors > 0 then bandageAt(take(floors).Position) end
		-- sujeira: manchas de sangue, papéis, poças
		for _ = 1, math.floor(r.w * r.h * 2) do
			local cf = take(floors)
			if cf then
				local blood = rnd:NextNumber() < 0.4
				decal(F.Props, cf * CFrame.new(0, 0.03, 0), Vector3.new(rnd:NextNumber(1.5, 4), 0.02, rnd:NextNumber(1, 3)), blood and Color3.fromRGB(58, 4, 6) or Color3.fromRGB(16, 14, 12), blood and 0.05 or 0.35)
			end
		end
		-- poeira no ar
		local dust = B.part(F.Props, { Name = "Dust", Size = Vector3.new(r.w * CELL - 4, 1, r.h * CELL - 4), CFrame = CFrame.new(roomCenter(r) + Vector3.new(0, 8, 0)), Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })
		local pe = Instance.new("ParticleEmitter"); pe.Texture = "rbxasset://textures/particles/sparkles_main.dds"; pe.Rate = 2 * r.w * r.h; pe.Lifetime = NumberRange.new(6, 10)
		pe.Speed = NumberRange.new(0.1, 0.4); pe.SpreadAngle = Vector2.new(180, 180); pe.Size = NumberSequence.new(0.06); pe.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 1) })
		pe.Color = ColorSequence.new(Color3.fromRGB(200, 190, 170)); pe.LightInfluence = 1; pe.Parent = dust
		-- teias nos cantos do teto
		for _, corner in ipairs({ Vector3.new(0, 0, 0), Vector3.new(r.w, 0, 0), Vector3.new(0, 0, r.h), Vector3.new(r.w, 0, r.h) }) do
			if rnd:NextNumber() < 0.5 then
				local p = Vector3.new(ox + (r.x + corner.X) * CELL, WALL_H - 1.2, oz + (r.y + corner.Z) * CELL)
				local inward = (roomCenter(r) - Vector3.new(p.X, 0, p.Z)).Unit
				B.part(F.Props, { Name = "Web", Size = Vector3.new(4, 2.5, 0.05), CFrame = CFrame.lookAt(p + inward * 1.6, p + inward * 1.6 + Vector3.new(inward.Z, 0, -inward.X)) * CFrame.Angles(0, 0, math.rad(15)), Color = Color3.fromRGB(200, 200, 200), Material = Enum.Material.ForceField, Transparency = 0.6, CanCollide = false, CanQuery = false })
			end
		end
	end

	-- ===== spawns =====
	local sc = roomCenter(startRoom)
	for i = 1, 16 do
		local a = (i / 16) * math.pi * 2
		local rr = (i % 2 == 0) and 6 or 10
		B.part(F.Spawns, { Name = "PlayerSpawn", Size = Vector3.new(2, 1, 2), CFrame = CFrame.new(sc + Vector3.new(math.cos(a) * rr, 0.5, math.sin(a) * rr)), Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })
	end
	local far, fd = rooms[1], -1
	for _, r in ipairs(rooms) do
		local d = (roomCenter(r) - sc).Magnitude
		if d > fd and r.type ~= "Stage" then far, fd = r, d end
	end
	B.part(F.Spawns, { Name = "MonsterSpawn", Size = Vector3.new(2, 1, 2), CFrame = CFrame.new(roomCenter(far) + Vector3.new(0, 3, 0)), Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })

	-- ===== saídas: 4, nas paredes externas, longe do início =====
	local outer = {}
	for _, seg in ipairs(walls) do if seg.outer and not nearDoor((seg[1] + seg[2]) / 2, 10) then table.insert(outer, seg) end end
	table.sort(outer, function(a, b) return ((a[1] + a[2]) / 2 - sc).Magnitude > ((b[1] + b[2]) / 2 - sc).Magnitude end)
	local used = {}
	local exits = 0
	for _, seg in ipairs(outer) do
		if exits >= 4 then break end
		local mid = (seg[1] + seg[2]) / 2
		local ok = true
		for _, u in ipairs(used) do if (u - mid).Magnitude < CELL * 2.5 then ok = false end end
		if ok then
			exits += 1
			table.insert(used, mid)
			local pos = mid + seg.outer * 1.15
			local door = B.ExitDoor(F.Exits, CFrame.lookAt(pos, pos + seg.outer))
			-- luz de emergência vermelha sobre a saída
			local em = B.part(F.Lights, { Name = "Emergency", Size = Vector3.new(1.4, 0.5, 0.5), CFrame = CFrame.lookAt(pos + Vector3.new(0, 12.5, 0) + seg.outer * 0.6, pos + Vector3.new(0, 12.5, 0) + seg.outer * 2), Color = Color3.fromRGB(255, 30, 20), Material = Enum.Material.Neon, CanCollide = false })
			local pl = Instance.new("PointLight"); pl.Range = 16; pl.Brightness = 0.9; pl.Color = Color3.fromRGB(255, 20, 10); pl.Parent = em
			em:SetAttribute("Flicker", true); CS:AddTag(em, "MapLight")
		end
	end
	-- garante pontos de atadura suficientes
	while #bandageSpots < 22 do
		local r = rooms[rnd:NextInteger(1, #rooms)]
		local fl = floorSpots(r)
		if #fl > 0 then bandageAt(fl[1].Position) else break end
	end
	map.PrimaryPart = nil
	map:SetAttribute("Lockers", lockerCount)
	return map
end

-- substitui os mapas antigos (pequenos) pelos gerados
function B.BuildAllMaps(store: Instance)
	local built = {}
	for id in pairs(THEMES) do
		local ok, m = pcall(B.BuildMap, id)
		if ok and m then built[id] = m else warn("[BLINDER] falha gerando mapa " .. id .. ": " .. tostring(m)) end
	end
	for id, m in pairs(built) do
		local old = store:FindFirstChild(id)
		if old then old:Destroy() end
		m.Parent = store
	end
	return built
end


-- =====================================================================
-- LOBBY DE TERROR: escurece a vila, lua de sangue, cemitério, pizzaria
-- abandonada e telões "TOP GLOBAL"
-- =====================================================================
function B.BuildLobbyHorror(lobby: Model, spawnPart: BasePart)
	local folder = Instance.new("Folder"); folder.Name = "Horror"; folder.Parent = lobby
	local rnd = Random.new(666)
	local origin = spawnPart.Position
	local rp = RaycastParams.new(); rp.FilterType = Enum.RaycastFilterType.Include; rp.FilterDescendantsInstances = { lobby, workspace.Terrain }
	local op = OverlapParams.new(); op.FilterType = Enum.RaycastFilterType.Include; op.FilterDescendantsInstances = { lobby }

	-- 1) vila mais escura e sem cor
	for _, d in ipairs(lobby:GetDescendants()) do
		if d:IsDescendantOf(folder) then continue end
		if d:IsA("BasePart") and d.Material ~= Enum.Material.Neon then
			local h, sat, v = d.Color:ToHSV()
			d.Color = Color3.fromHSV(h, sat * 0.55, v * 0.6)
		elseif d:IsA("PointLight") or d:IsA("SpotLight") or d:IsA("SurfaceLight") then
			d.Color = d.Color:Lerp(Color3.fromRGB(255, 90, 50), 0.45)
			d.Brightness *= 0.75
			d.Shadows = true
		end
	end

	local function ground(p: Vector3): Vector3?
		local hit = workspace:Raycast(Vector3.new(p.X, origin.Y + 60, p.Z), Vector3.new(0, -140, 0), rp)
		if hit and math.abs(hit.Position.Y - origin.Y) < 14 and hit.Normal.Y > 0.6 then return hit.Position end
		return nil
	end
	local function freeAt(p: Vector3, size: Vector3): boolean
		return #workspace:GetPartBoundsInBox(CFrame.new(p + Vector3.new(0, size.Y / 2 + 0.6, 0)), size, op) == 0
	end
	-- procura um lugar livre num anel em volta do spawn
	local function spot(dist: number, size: Vector3, a0: number?): Vector3?
		for t = 0, 47 do
			local a = (a0 or 0) + t * 0.37
			for _, dd in ipairs({ dist, dist * 1.3, dist * 0.8, dist * 1.6 }) do
				local g = ground(origin + Vector3.new(math.cos(a) * dd, 0, math.sin(a) * dd))
				if g and freeAt(g, size) then return g end
			end
		end
		return nil
	end
	local function face(p: Vector3) return CFrame.lookAt(p, Vector3.new(origin.X, p.Y, origin.Z)) end

	-- 2) telões TOP GLOBAL
	local boards = {}
	local defs = {
		{ stat = "Money", title = "TOP GLOBAL · MAIS RICOS", color = Color3.fromRGB(240, 180, 50), fmt = "$%s" },
		{ stat = "Escapes", title = "TOP GLOBAL · SOBREVIVENTES", color = Color3.fromRGB(90, 220, 120), fmt = "%s fugas" },
		{ stat = "Kills", title = "TOP GLOBAL · CARNIFICINA", color = Color3.fromRGB(240, 50, 50), fmt = "%s vítimas" },
		{ stat = "Level", title = "TOP GLOBAL · VETERANOS", color = Color3.fromRGB(170, 90, 240), fmt = "nível %s" },
	}
	for i, d in ipairs(defs) do
		local p = spot(34, Vector3.new(16, 18, 4), (i - 1) * 0.55 - 0.8)
		if p then
			local m = Instance.new("Model"); m.Name = "GlobalBoard_" .. d.stat; m.Parent = folder
			local cf = face(p)
			-- pilares de pedra rachada
			for _, s in ipairs({ -1, 1 }) do
				B.part(m, { Size = Vector3.new(1.6, 19, 1.6), CFrame = cf * CFrame.new(s * 8, 9.5, 0), Color = Color3.fromRGB(34, 32, 34), Material = Enum.Material.Slate })
				B.part(m, { Shape = Enum.PartType.Ball, Size = Vector3.new(2.2, 2.2, 2.2), CFrame = cf * CFrame.new(s * 8, 19.4, 0), Color = Color3.fromRGB(26, 24, 26), Material = Enum.Material.Slate })
				local fire = B.part(m, { Name = "Brazier", Size = Vector3.new(0.6, 0.6, 0.6), CFrame = cf * CFrame.new(s * 8, 20.8, 0), Transparency = 1, CanCollide = false })
				local f = Instance.new("Fire"); f.Color = Color3.fromRGB(255, 60, 20); f.SecondaryColor = Color3.fromRGB(80, 0, 0); f.Size = 3; f.Heat = 6; f.Parent = fire
				local l = Instance.new("PointLight"); l.Range = 18; l.Brightness = 1.5; l.Color = Color3.fromRGB(255, 70, 30); l.Shadows = true; l.Parent = fire
				CS:AddTag(fire, "Candle")
			end
			local screen = B.part(m, { Name = "Screen", Size = Vector3.new(14.4, 15, 0.5), CFrame = cf * CFrame.new(0, 10, 0), Color = Color3.fromRGB(6, 4, 6), Material = Enum.Material.SmoothPlastic })
			B.part(m, { Size = Vector3.new(15, 0.3, 0.7), CFrame = cf * CFrame.new(0, 17.6, 0), Color = d.color, Material = Enum.Material.Neon })
			B.part(m, { Size = Vector3.new(15, 0.3, 0.7), CFrame = cf * CFrame.new(0, 2.4, 0), Color = d.color, Material = Enum.Material.Neon })
			local g = Instance.new("SurfaceGui"); g.Name = "Gui"; g.Face = Enum.NormalId.Front; g.CanvasSize = Vector2.new(560, 600); g.LightInfluence = 0; g.Brightness = 1.4; g.Parent = screen
			local t = Instance.new("TextLabel"); t.Name = "Title"; t.Size = UDim2.new(1, 0, 0, 70); t.BackgroundTransparency = 1; t.Text = d.title; t.Font = Enum.Font.Creepster; t.TextScaled = true; t.TextColor3 = d.color; t.Parent = g
			local rows = {}
			for r = 1, 10 do
				local row = Instance.new("TextLabel"); row.Name = "Row" .. r
				row.Position = UDim2.new(0, 24, 0, 78 + (r - 1) * 50); row.Size = UDim2.new(1, -48, 0, 44)
				row.BackgroundColor3 = r <= 3 and d.color or Color3.fromRGB(30, 24, 28); row.BackgroundTransparency = r <= 3 and 0.82 or 0.6
				row.Font = Enum.Font.GothamBold; row.TextScaled = true; row.TextXAlignment = Enum.TextXAlignment.Left
				row.TextColor3 = r == 1 and Color3.fromRGB(255, 220, 120) or Color3.fromRGB(225, 215, 210); row.Text = r .. ".  ..."
				local pad = Instance.new("UIPadding"); pad.PaddingLeft = UDim.new(0, 10); pad.PaddingTop = UDim.new(0, 6); pad.PaddingBottom = UDim.new(0, 6); pad.Parent = row
				local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, 6); c.Parent = row
				row.Parent = g
				rows[r] = row
			end
			-- respingos de sangue no telão
			for _ = 1, 4 do
				B.part(m, { Size = Vector3.new(rnd:NextNumber(0.4, 1.4), rnd:NextNumber(0.6, 3), 0.05), CFrame = cf * CFrame.new(rnd:NextNumber(-6.5, 6.5), rnd:NextNumber(4, 16), -0.28), Color = Color3.fromRGB(90, 4, 6), Material = Enum.Material.SmoothPlastic, CanCollide = false })
			end
			table.insert(boards, { stat = d.stat, rows = rows, fmt = d.fmt })
		end
	end

	-- 3) pizzaria abandonada (referência aos jogos de animatrônicos)
	local pp = spot(70, Vector3.new(44, 22, 30), 2.4)
	if pp then
		local m = Instance.new("Model"); m.Name = "AbandonedPizzeria"; m.Parent = folder
		local cf = face(pp)
		local wall = Color3.fromRGB(40, 26, 30)
		B.part(m, { Size = Vector3.new(40, 18, 1.2), CFrame = cf * CFrame.new(0, 9, 12), Color = wall, Material = Enum.Material.Brick })
		for _, s in ipairs({ -1, 1 }) do B.part(m, { Size = Vector3.new(1.2, 18, 24), CFrame = cf * CFrame.new(s * 20, 9, 0), Color = wall, Material = Enum.Material.Brick }) end
		B.part(m, { Size = Vector3.new(42, 1.2, 26), CFrame = cf * CFrame.new(0, 18.6, 0), Color = Color3.fromRGB(20, 16, 18), Material = Enum.Material.Slate })
		-- fachada com porta arrombada e janelas tapadas
		for _, seg in ipairs({ { -13, 14 }, { 13, 14 } }) do
			B.part(m, { Size = Vector3.new(seg[2], 18, 1.2), CFrame = cf * CFrame.new(seg[1], 9, -12), Color = wall, Material = Enum.Material.Brick })
		end
		B.part(m, { Size = Vector3.new(12, 8, 1.2), CFrame = cf * CFrame.new(0, 14, -12), Color = wall, Material = Enum.Material.Brick })
		for _, s in ipairs({ -1, 1 }) do
			for b = 0, 3 do
				B.part(m, { Size = Vector3.new(7, 0.8, 0.3), CFrame = cf * CFrame.new(s * 13, 7 + b * 1.2, -12.8) * CFrame.Angles(0, 0, math.rad(rnd:NextNumber(-14, 14))), Color = Color3.fromRGB(62, 44, 30), Material = Enum.Material.WoodPlanks })
			end
		end
		B.part(m, { Size = Vector3.new(5.5, 9.5, 0.4), CFrame = cf * CFrame.new(-4.5, 4.6, -13.6) * CFrame.Angles(0, math.rad(-62), math.rad(4)), Color = Color3.fromRGB(70, 20, 20), Material = Enum.Material.Metal })
		-- letreiro neon quebrado
		local sign = B.part(m, { Name = "Sign", Size = Vector3.new(30, 5, 0.6), CFrame = cf * CFrame.new(0, 22, -12) * CFrame.Angles(0, 0, math.rad(-4)), Color = Color3.fromRGB(16, 10, 12), Material = Enum.Material.Metal })
		local sgui = Instance.new("SurfaceGui"); sgui.Name = "Gui"; sgui.Face = Enum.NormalId.Front; sgui.CanvasSize = Vector2.new(900, 150); sgui.LightInfluence = 0; sgui.Brightness = 2; sgui.Parent = sign
		local st = Instance.new("TextLabel"); st.Name = "Title"; st.Size = UDim2.fromScale(1, 1); st.BackgroundTransparency = 1; st.Text = "PIZZARIA DO URSO FELIZ"; st.Font = Enum.Font.Creepster; st.TextScaled = true; st.TextColor3 = Color3.fromRGB(255, 60, 120); st.Parent = sgui
		local sl = Instance.new("SurfaceLight"); sl.Face = Enum.NormalId.Front; sl.Color = Color3.fromRGB(255, 40, 110); sl.Range = 22; sl.Brightness = 2.2; sl.Parent = sign
		CS:AddTag(sign, "NeonSign")
		-- animatrônicos olhando pela porta / pela janela
		local bear = B.AnimatronicStatue(m, cf * CFrame.new(0, 0, -6) * CFrame.Angles(0, math.pi, 0), "Bear")
		bear:RemoveTag("Breakable"); bear:SetAttribute("Breakable", nil)
		local fox = B.AnimatronicStatue(m, cf * CFrame.new(12, 0, -4) * CFrame.Angles(0, math.pi + 0.4, 0), "Fox")
		fox:RemoveTag("Breakable"); fox:SetAttribute("Breakable", nil)
		local inner = B.part(m, { Size = Vector3.new(1, 1, 1), CFrame = cf * CFrame.new(0, 14, 0), Transparency = 1, CanCollide = false })
		local il = Instance.new("PointLight"); il.Range = 26; il.Brightness = 0.8; il.Color = Color3.fromRGB(255, 40, 30); il.Parent = inner
		inner:SetAttribute("Flicker", true); CS:AddTag(inner, "Candle")
		-- placa de aviso
		local warnP = B.part(m, { Size = Vector3.new(6, 3, 0.2), CFrame = cf * CFrame.new(9, 4, -14.5) * CFrame.Angles(0, 0, math.rad(6)), Color = Color3.fromRGB(200, 180, 60), Material = Enum.Material.Metal })
		sg(warnP, Enum.NormalId.Front, "INTERDITADO — NÃO ENTRE APÓS MEIA-NOITE", Enum.Font.SpecialElite, Color3.fromRGB(20, 10, 10))
	end

	-- 4) letreiro gigante BLINDER
	local tp = spot(55, Vector3.new(40, 16, 4), -2.2)
	if tp then
		local cf = face(tp)
		local t = B.part(folder, { Name = "BlinderTitle", Size = Vector3.new(44, 12, 1), CFrame = cf * CFrame.new(0, 14, 0), Transparency = 1, CanCollide = false })
		local g = Instance.new("SurfaceGui"); g.Face = Enum.NormalId.Front; g.CanvasSize = Vector2.new(1100, 300); g.LightInfluence = 0; g.Brightness = 3; g.Parent = t
		local l = Instance.new("TextLabel"); l.Size = UDim2.fromScale(1, 1); l.BackgroundTransparency = 1; l.Text = "BLINDER"; l.Font = Enum.Font.Creepster; l.TextScaled = true; l.TextColor3 = Color3.fromRGB(200, 10, 20); l.TextStrokeTransparency = 0; l.TextStrokeColor3 = Color3.new(0, 0, 0); l.Parent = g
		local sl = Instance.new("SurfaceLight"); sl.Face = Enum.NormalId.Front; sl.Range = 30; sl.Brightness = 2.5; sl.Color = Color3.fromRGB(255, 20, 20); sl.Parent = t
		local sub = B.part(folder, { Size = Vector3.new(34, 3, 1), CFrame = cf * CFrame.new(0, 6.5, 0), Transparency = 1, CanCollide = false })
		sg(sub, Enum.NormalId.Front, "ele não vê. ele ESCUTA.", Enum.Font.SpecialElite, Color3.fromRGB(230, 210, 200))
		for _, s in ipairs({ -1, 1 }) do B.part(folder, { Size = Vector3.new(0.8, 22, 0.8), CFrame = cf * CFrame.new(s * 20, 10, 0.8), Color = Color3.fromRGB(20, 18, 18), Material = Enum.Material.Metal }) end
	end

	-- 5) cemitério de quem fez barulho
	local NAMES = { "fez barulho", "correu demais", "saiu do armário", "quebrou o vaso", "olhou pra trás", "acendeu a luz", "gritou", "voltou pela mochila" }
	for i = 1, 18 do
		local p = spot(rnd:NextNumber(24, 60), Vector3.new(3, 5, 2), rnd:NextNumber(0, 6.28))
		if p then
			local cf = face(p) * CFrame.Angles(math.rad(rnd:NextNumber(-8, 8)), 0, math.rad(rnd:NextNumber(-10, 10)))
			if i % 3 == 0 then
				B.part(folder, { Name = "Cross", Size = Vector3.new(0.5, 4.5, 0.5), CFrame = cf * CFrame.new(0, 2, 0), Color = Color3.fromRGB(40, 30, 24), Material = Enum.Material.Wood })
				B.part(folder, { Size = Vector3.new(2.6, 0.5, 0.5), CFrame = cf * CFrame.new(0, 3.1, 0), Color = Color3.fromRGB(40, 30, 24), Material = Enum.Material.Wood })
			else
				local st = B.part(folder, { Name = "Tomb", Size = Vector3.new(2.4, 3.4, 0.6), CFrame = cf * CFrame.new(0, 1.5, 0), Color = Color3.fromRGB(58, 56, 60), Material = Enum.Material.Slate })
				sg(st, Enum.NormalId.Front, "AQUI JAZ\nquem " .. NAMES[rnd:NextInteger(1, #NAMES)], Enum.Font.SpecialElite, Color3.fromRGB(200, 196, 190))
			end
			B.part(folder, { Name = "Dirt", Size = Vector3.new(2.6, 0.4, 5), CFrame = face(p) * CFrame.new(0, 0.1, -2.8), Color = Color3.fromRGB(30, 22, 18), Material = Enum.Material.Ground, CanCollide = false })
			if rnd:NextNumber() < 0.35 then
				local c = B.part(folder, { Name = "Candle", Size = Vector3.new(0.3, 0.7, 0.3), CFrame = face(p) * CFrame.new(0.9, 0.4, -0.8), Color = Color3.fromRGB(220, 210, 190), Material = Enum.Material.SmoothPlastic, CanCollide = false })
				local l = Instance.new("PointLight"); l.Range = 8; l.Brightness = 1; l.Color = Color3.fromRGB(255, 130, 50); l.Parent = c
				CS:AddTag(c, "Candle")
			end
		end
	end

	-- 6) árvores mortas com corda pendurada
	for i = 1, 10 do
		local p = spot(rnd:NextNumber(40, 90), Vector3.new(6, 14, 6), rnd:NextNumber(0, 6.28))
		if p then
			local cf = CFrame.new(p) * CFrame.Angles(0, rnd:NextNumber(0, 6.28), 0)
			local trunk = B.part(folder, { Name = "DeadTree", Size = Vector3.new(1.6, 14, 1.6), CFrame = cf * CFrame.new(0, 7, 0) * CFrame.Angles(0, 0, math.rad(rnd:NextNumber(-6, 6))), Color = Color3.fromRGB(26, 20, 18), Material = Enum.Material.Wood })
			for b = 1, 4 do
				B.part(folder, { Size = Vector3.new(0.6, rnd:NextNumber(4, 7), 0.6), CFrame = trunk.CFrame * CFrame.new(0, rnd:NextNumber(0, 6), 0) * CFrame.Angles(0, b * 1.6, math.rad(rnd:NextNumber(35, 70))) * CFrame.new(0, 2.5, 0), Color = Color3.fromRGB(24, 18, 16), Material = Enum.Material.Wood })
			end
			if i % 3 == 0 then
				B.part(folder, { Name = "Rope", Size = Vector3.new(0.12, 4, 0.12), CFrame = trunk.CFrame * CFrame.new(1.8, 3, 0), Color = Color3.fromRGB(110, 90, 60), Material = Enum.Material.Fabric, CanCollide = false })
				B.part(folder, { Name = "Noose", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.2, 1.1, 1.1), CFrame = trunk.CFrame * CFrame.new(1.8, 0.8, 0), Color = Color3.fromRGB(110, 90, 60), Material = Enum.Material.Fabric, CanCollide = false })
			end
		end
	end

	-- 7) lua de sangue e névoa rasteira
	local moon = B.part(folder, { Name = "BloodMoon", Shape = Enum.PartType.Ball, Size = Vector3.new(160, 160, 160), CFrame = CFrame.new(origin + Vector3.new(-700, 420, -900)), Color = Color3.fromRGB(150, 12, 8), Material = Enum.Material.Neon, CanCollide = false, CanQuery = false, CastShadow = false })
	local fogP = B.part(folder, { Name = "GroundFog", Size = Vector3.new(260, 1, 260), CFrame = CFrame.new(origin + Vector3.new(0, 1, 0)), Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })
	local pe = Instance.new("ParticleEmitter"); pe.Texture = "rbxasset://textures/particles/smoke_main.dds"; pe.Rate = 30; pe.Lifetime = NumberRange.new(10, 16)
	pe.Speed = NumberRange.new(0.3, 1); pe.SpreadAngle = Vector2.new(180, 10); pe.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 8), NumberSequenceKeypoint.new(1, 16) })
	pe.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.4, 0.86), NumberSequenceKeypoint.new(1, 1) })
	pe.Color = ColorSequence.new(Color3.fromRGB(70, 50, 60)); pe.LightInfluence = 0.7; pe.Rotation = NumberRange.new(0, 360); pe.RotSpeed = NumberRange.new(-8, 8); pe.Parent = fogP
	-- corvos parados nos telhados (pontinhos pretos)
	return boards, moon
end

return B
