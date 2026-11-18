-- BLINDER :: monstros de malha 3D (gerados) -> rig animável
-- Os modelos-base ficam em ReplicatedStorage.Blinder.MonsterRigs.<Id> (já riggados).
-- Juntas (Motor6D): RootJoint (raiz->tronco), Neck, LShoulder, RShoulder, LHip, RHip.
local RS = game:GetService("ReplicatedStorage")
local Config = require(RS.Blinder.Config)
local R = {}

local function find(model: Instance, key: string): BasePart?
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") and string.find(string.lower(d.Name), key, 1, true) then return d end
	end
	return nil
end

local function motor(name, p0: BasePart, p1: BasePart, jointWorld: CFrame)
	local m = Instance.new("Motor6D")
	m.Name = name; m.Part0 = p0; m.Part1 = p1
	m.C0 = p0.CFrame:Inverse() * jointWorld
	m.C1 = p1.CFrame:Inverse() * jointWorld
	m.Parent = p0
	return m
end

local function top(p: BasePart) return p.Position.Y + p.Size.Y / 2 end
local function bottom(p: BasePart) return p.Position.Y - p.Size.Y / 2 end

-- Converte um modelo segmentado (cabeça/tronco/braços/pernas) em rig. Uso no Studio (edição).
function R.BuildRig(src: Model, id: string, height: number): Model
	local m = src:Clone()
	local _, size = m:GetBoundingBox()
	m:ScaleTo(m:GetScale() * (height / size.Y))
	local cf, size2 = m:GetBoundingBox()
	local ground = cf.Position.Y - size2.Y / 2
	m:PivotTo(m:GetPivot() + Vector3.new(-cf.Position.X, -ground, -cf.Position.Z))
	local parts = {
		Head = find(m, "head"), Torso = find(m, "torso"),
		LArm = find(m, "left arm"), RArm = find(m, "right arm"),
		LLeg = find(m, "left leg"), RLeg = find(m, "right leg"),
	}
	local rig = Instance.new("Model"); rig.Name = id
	for name, p in pairs(parts) do
		assert(p, "parte faltando: " .. name)
		p.Name = name
		p.Anchored = false; p.CanCollide = false; p.CanQuery = false; p.CanTouch = false; p.Massless = true
		p.Parent = rig
	end
	m:Destroy()
	local T = parts.Torso
	local legTop = math.max(top(parts.LLeg), top(parts.RLeg))
	local hipY = math.min(legTop, bottom(T) + T.Size.Y * 0.25)
	local root = Instance.new("Part")
	root.Name = "HumanoidRootPart"; root.Size = Vector3.new(2.4, 2.4, 1.4); root.Transparency = 1
	root.CanCollide = true; root.CanQuery = false; root.CanTouch = true
	root.CFrame = CFrame.new(0, hipY, T.Position.Z)
	root.Parent = rig
	rig.PrimaryPart = root
	motor("RootJoint", root, T, CFrame.new(0, hipY, T.Position.Z))
	local H = parts.Head
	motor("Neck", T, H, CFrame.new(H.Position.X, math.max(bottom(H) + H.Size.Y * 0.12, top(T) - T.Size.Y * 0.08), H.Position.Z))
	for _, side in ipairs({ { "L", parts.LArm, -1 }, { "R", parts.RArm, 1 } }) do
		local a = side[2]
		-- ombro: topo do braço, puxado para o lado do tronco
		local sx = a.Position.X - side[3] * a.Size.X * 0.22
		motor(side[1] .. "Shoulder", T, a, CFrame.new(sx, top(a) - a.Size.Y * 0.08, a.Position.Z))
	end
	for _, side in ipairs({ { "L", parts.LLeg }, { "R", parts.RLeg } }) do
		local l = side[2]
		motor(side[1] .. "Hip", T, l, CFrame.new(l.Position.X, top(l) - l.Size.Y * 0.06, l.Position.Z))
	end
	local hum = Instance.new("Humanoid")
	hum.HipHeight = hipY - root.Size.Y / 2
	hum.RequiresNeck = false
	hum.BreakJointsOnDeath = false
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	hum.Parent = rig
	rig:SetAttribute("RigKind", "Mesh")
	rig:SetAttribute("MonsterType", id)
	return rig
end

-- aplica a skin (variação de material/cor) no modelo
function R.ApplySkin(model: Model, skinId: string?)
	local skin = Config.GetMonsterSkin(skinId or "Original")
	model:SetAttribute("Skin", skin.id)
	if skin.style.kind ~= "Tint" then return end
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("MeshPart") then
			d.TextureID = ""
			d.Color = skin.style.color
			d.Material = skin.style.material
			if skin.id == "Ghost" then d.Transparency = 0.15 end
		elseif d:IsA("SurfaceAppearance") then
			d:Destroy()
		end
	end
end

function R.Template(typeId: string): Model?
	local folder = RS.Blinder:FindFirstChild("MonsterRigs")
	return folder and (folder:FindFirstChild(typeId) or folder:FindFirstChild("Blinder"))
end

-- cópia pronta para uso. anchored = vitrine/prévia
function R.Clone(typeId: string, skinId: string?, anchored: boolean?): Model?
	local t = R.Template(typeId)
	if not t then return nil end
	local m = t:Clone()
	R.ApplySkin(m, skinId)
	if anchored then m.PrimaryPart.Anchored = true end
	m:SetAttribute("MonsterType", typeId)
	return m
end

return R
