-- BLINDER :: animação procedural do monstro (roda em todos os clientes)
-- Corrida desengonçada, braços balançando, cabeça farejando e espasmos aleatórios.
local RunService = game:GetService("RunService")
local CS = game:GetService("CollectionService")
local Players = game:GetService("Players")

local A = {}
local rigs = {} -- [model] = data

local function collect(model: Model, root: BasePart)
	local motors = {}
	local scope = model:FindFirstChild("MonsterVisual") or model
	for _, d in ipairs(scope:GetDescendants()) do
		if d:IsA("Motor6D") then motors[d.Name] = d end
	end
	local rj = root:FindFirstChild("RootJoint")
	if rj and rj:IsA("Motor6D") and rj.Part1 and rj.Part1.Name == "Pelvis" then motors.RootJoint = rj end
	return { model = model, root = root, m = motors, phase = math.random() * 10, twitch = 0, twitchT = 0, sniff = 0, lean = 0, mesh = model:GetAttribute("RigKind") == "Mesh" }
end

local function track(model: Model)
	if rigs[model] then return end
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart
	if not root then return end
	task.wait(0.2)
	rigs[model] = collect(model, root)
	model.AncestryChanged:Connect(function(_, p) if not p then rigs[model] = nil end end)
end

local CF = CFrame.Angles
local sin, cos, rad = math.sin, math.cos, math.rad
local KILL_DUR = 1.2

-- ======= helpers de terror =======
-- "glitch": o corpo congela por um instante e depois estala para outra pose (stop-motion)
local function glitch(r, dt, chase)
	r.glitchT = (r.glitchT or 2) - dt
	if r.frozen then
		r.frozen -= dt
		if r.frozen <= 0 then r.frozen = nil; r.snap = 1 end
		return true
	end
	if r.glitchT <= 0 then
		r.glitchT = chase and (1.2 + math.random() * 2) or (2.5 + math.random() * 5)
		r.frozen = 0.08 + math.random() * (chase and 0.12 or 0.35)
		-- pose estranha guardada para estalar
		r.snapNeck = CF((math.random() - 0.5) * 0.9, (math.random() - 0.5) * 1.6, (math.random() - 0.5) * 1.8)
	end
	r.snap = (r.snap or 0) * (1 - math.min(1, dt * 7))
	return false
end

-- pose de matar: braços abrem, agarram, cabeça vai pra trás e avança gritando
local function killPose(r, k)
	local m = r.m
	local open = math.clamp(k / 0.25, 0, 1)
	local grab = math.clamp((k - 0.25) / 0.15, 0, 1)
	local scream = math.clamp((k - 0.4) / 0.2, 0, 1)
	local shake = (k > 0.4) and (math.random() - 0.5) * 0.25 or 0
	local sh = rad(-150) * open + rad(70) * grab
	local spread = rad(55) * open - rad(45) * grab
	if r.mesh then sh = -sh end
	if m.LShoulder then m.LShoulder.Transform = CF(sh, 0, -spread) end
	if m.RShoulder then m.RShoulder.Transform = CF(sh, 0, spread) end
	if m.LElbow then m.LElbow.Transform = CF(rad(-40) * grab, 0, 0) end
	if m.RElbow then m.RElbow.Transform = CF(rad(-40) * grab, 0, 0) end
	if m.Neck then m.Neck.Transform = CF(rad(35) * open - rad(70) * scream + shake, shake, shake * 1.5) end
	local torsoTilt = rad(-12) * open + rad(38) * scream
	if m.Waist then m.Waist.Transform = CF(-torsoTilt, 0, shake * 0.4) end
	if m.RootJoint then m.RootJoint.Transform = CFrame.new(0, -0.6 * scream, 0) * CF(r.mesh and -torsoTilt or 0, 0, 0) end
	if m.LHip then m.LHip.Transform = CF(rad(25) * scream, 0, 0) end
	if m.RHip then m.RHip.Transform = CF(rad(-30) * scream, 0, 0) end
	if m.LKnee then m.LKnee.Transform = CF(rad(-45) * scream, 0, 0) end
	if m.RKnee then m.RKnee.Transform = CF(rad(-20) * scream, 0, 0) end
end

local function killing(r): number?
	local t = r.model:GetAttribute("KillAt")
	if not t then return nil end
	local k = workspace:GetServerTimeNow() - t
	if k >= 0 and k < KILL_DUR then return k end
	return nil
end

-- rig de malha 3D (cabeça/tronco/braços/pernas inteiriços)
local function animateMesh(r, dt)
	local root = r.root
	local kk = killing(r)
	if kk then killPose(r, kk); return end
	local v = root.AssemblyLinearVelocity
	local speed = Vector3.new(v.X, 0, v.Z).Magnitude
	local state = r.model:GetAttribute("State") or (speed > 17 and "Chase" or "Wander")
	local chase = state == "Chase" or speed > 19
	if glitch(r, dt, chase) then return end
	local run = math.clamp(speed / 22, 0, 1.25)
	r.phase += dt * (1.6 + speed * 0.42)
	local p = r.phase
	local m = r.m
	r.twitchT -= dt
	if r.twitchT <= 0 then
		r.twitchT = 0.25 + math.random() * (chase and 0.5 or 1.8)
		r.twitch = (math.random() - 0.5) * (chase and 1.6 or 0.9)
	end
	r.twitch *= (1 - math.min(1, dt * 10))
	r.lean += ((chase and 0.62 or 0.22) - r.lean) * math.min(1, dt * 4)
	local stride = 0.14 + run * 0.9
	-- passada manca: uma perna arrasta
	if m.LHip then m.LHip.Transform = CF(sin(p) * stride, 0, 0) end
	if m.RHip then m.RHip.Transform = CF(-sin(p) * stride * 0.7, 0, rad(4)) end
	if chase then
		-- braços esticados pra frente, dedos tremendo, querendo agarrar
		local fl = sin(p * 1.3) * 0.25
		local tr = (math.random() - 0.5) * 0.12
		if m.LShoulder then m.LShoulder.Transform = CF(rad(95) + fl + tr, 0, rad(-18) + sin(p * 2.1) * 0.25) end
		if m.RShoulder then m.RShoulder.Transform = CF(rad(95) - fl - tr, 0, rad(18) - sin(p * 1.7) * 0.25) end
	else
		-- braços pendurados, balançando mortos
		local sw = sin(p * 0.5) * (0.05 + run * 0.35)
		if m.LShoulder then m.LShoulder.Transform = CF(-sw + 0.15, 0, rad(-2)) end
		if m.RShoulder then m.RShoulder.Transform = CF(sw + 0.2, 0, rad(2)) end
	end
	r.sniff += dt
	-- cabeça: farejando, inclinada de lado (pescoço quebrado), giros bruscos
	local sniff = (not chase) and (sin(r.sniff * 11) * 0.06 + sin(r.sniff * 0.9) * 0.6) or 0
	local tilt = (not chase) and (0.45 + sin(r.sniff * 0.4) * 0.25) or sin(p * 4) * 0.2
	local snap = r.snap or 0
	local neck = CF(sin(p * 2) * 0.12 * run + r.twitch * 0.5 + (chase and -0.3 or 0.15), sniff + r.twitch, tilt + r.twitch * 0.8)
	if snap > 0.01 and r.snapNeck then neck = neck:Lerp(r.snapNeck, snap) end
	if m.Neck then m.Neck.Transform = neck end
	if m.RootJoint then m.RootJoint.Transform = CFrame.new(0, math.abs(sin(p)) * 0.5 * run - (chase and 0.4 or 0), 0) * CF(-r.lean, sin(p * 0.5) * 0.08, sin(p) * 0.1 * run) end
end

local function animate(r, dt)
	local root = r.root
	if not root.Parent then return end
	if r.mesh then return animateMesh(r, dt) end
	local kk = killing(r)
	if kk then killPose(r, kk); return end
	local v = root.AssemblyLinearVelocity
	local speed = Vector3.new(v.X, 0, v.Z).Magnitude
	local state = r.model:GetAttribute("State") or (speed > 16 and "Chase" or "Wander")
	local chase = state == "Chase"
	if glitch(r, dt, chase) then return end
	local run = math.clamp(speed / 20, 0, 1.2)
	r.phase += dt * (2 + speed * 0.55)
	local p = r.phase
	local m = r.m

	-- espasmos
	r.twitchT -= dt
	if r.twitchT <= 0 then
		r.twitchT = 0.25 + math.random() * (chase and 0.6 or 2)
		r.twitch = (math.random() - 0.5) * (chase and 1.8 or 1.0)
	end
	r.twitch *= (1 - math.min(1, dt * 10))
	r.lean += ((chase and 0.8 or 0.18) - r.lean) * math.min(1, dt * 4)

	local stride = 0.25 + run * 0.95
	if m.LHip then m.LHip.Transform = CF(sin(p) * stride, 0, 0) end
	if m.RHip then m.RHip.Transform = CF(-sin(p) * stride * 0.75, 0, rad(5)) end
	if m.LKnee then m.LKnee.Transform = CF(-math.max(0, -cos(p)) * (0.4 + run * 1.3) - (chase and 0.35 or 0), 0, 0) end
	if m.RKnee then m.RKnee.Transform = CF(-math.max(0, cos(p)) * (0.4 + run * 1.3) - (chase and 0.35 or 0), 0, 0) end

	if chase then
		-- corrida curvada, braços para frente com garras abertas se debatendo
		local flail = sin(p * 1.3) * 0.45
		local tr = (math.random() - 0.5) * 0.15
		if m.LShoulder then m.LShoulder.Transform = CF(rad(-105) + flail + tr, 0, rad(-20) + sin(p * 2.1) * 0.3) end
		if m.RShoulder then m.RShoulder.Transform = CF(rad(-105) - flail - tr, 0, rad(20) - sin(p * 1.7) * 0.3) end
		if m.LElbow then m.LElbow.Transform = CF(rad(-25) + sin(p * 2) * 0.4, 0, 0) end
		if m.RElbow then m.RElbow.Transform = CF(rad(-25) - sin(p * 2) * 0.4, 0, 0) end
	else
		-- braços mortos pendurados, um pouco tortos
		local swing = sin(p * 0.6) * (0.08 + run * 0.4)
		if m.LShoulder then m.LShoulder.Transform = CF(-swing, rad(10), rad(-3)) end
		if m.RShoulder then m.RShoulder.Transform = CF(swing, rad(-15), rad(4)) end
		if m.LElbow then m.LElbow.Transform = CF(rad(-6), 0, 0) end
		if m.RElbow then m.RElbow.Transform = CF(rad(-18) + sin(r.sniff * 7) * 0.08, 0, 0) end
	end

	r.sniff += dt
	local sniff = (not chase) and (sin(r.sniff * 11) * 0.07 + sin(r.sniff * 0.9) * 0.7) or 0
	local tilt = (not chase) and (0.55 + sin(r.sniff * 0.35) * 0.3) or sin(p * 4) * 0.25
	local neck = CF(sin(p * 2) * 0.12 * run + r.twitch * 0.6 + (chase and -0.35 or 0.2), sniff + r.twitch, tilt + r.twitch * 0.9)
	local snap = r.snap or 0
	if snap > 0.01 and r.snapNeck then neck = neck:Lerp(r.snapNeck, snap) end
	if m.Neck then m.Neck.Transform = neck end
	if m.Waist then m.Waist.Transform = CF(-r.lean + sin(p * 2) * 0.06, sin(p) * 0.15 * run, sin(r.sniff * 0.5) * 0.08) end
	if m.RootJoint then m.RootJoint.Transform = CFrame.new(0, math.abs(sin(p)) * 0.35 * run - (chase and 0.5 or 0), 0) * CF(0, 0, sin(p) * 0.08) end
end

function A.init()
	for _, m in ipairs(CS:GetTagged("Monster")) do task.spawn(track, m) end
	CS:GetInstanceAddedSignal("Monster"):Connect(function(m) task.spawn(track, m) end)
	-- jogador-monstro: personagem com MonsterVisual
	local function watchChar(char)
		char.ChildAdded:Connect(function(c)
			if c.Name == "MonsterVisual" then task.spawn(track, char) end
		end)
		if char:FindFirstChild("MonsterVisual") or char:GetAttribute("RigKind") == "Mesh" then task.spawn(track, char) end
	end
	for _, p in ipairs(Players:GetPlayers()) do
		if p.Character then watchChar(p.Character) end
		p.CharacterAdded:Connect(watchChar)
	end
	Players.PlayerAdded:Connect(function(p) p.CharacterAdded:Connect(watchChar) end)

	RunService.Stepped:Connect(function(_, dt)
		for _, r in pairs(rigs) do
			local ok = pcall(animate, r, dt)
			if not ok then end
		end
	end)
end

function A.getMonsters(): { Model }
	local t = {}
	for m in pairs(rigs) do if m.Parent then table.insert(t, m) end end
	return t
end

return A
