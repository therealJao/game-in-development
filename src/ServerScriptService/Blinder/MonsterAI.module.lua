-- BLINDER :: cérebro do monstro controlado por IA
-- O Blinder é CEGO: caça pelo SOM. Correr, quebrar coisas e falhar no armário fazem barulho.
local RS = game:GetService("ReplicatedStorage")
local Config = require(RS.Blinder.Config)

local AI = {}
AI.__index = AI

local TICK = 0.12

function AI.new(model: Model, ctx)
	local self = setmetatable({}, AI)
	self.model = model
	self.root = model.PrimaryPart
	self.hum = model:FindFirstChildOfClass("Humanoid")
	self.ctx = ctx
	self.state = "Wander"
	self.target = nil
	self.lastKnown = nil
	self.lastHeard = 0
	self.investigatePos = nil
	self.locker = nil
	self.lockerFailed = false
	self.lockerCooldown = {}
	self.path = nil
	self.wp = nil
	self.wpIndex = 0
	self.pathGoal = nil
	self.pathTime = 0
	self.pauseUntil = 0
	self.alive = true
	self.stuckT = 0
	self.lastPos = self.root.Position
	return self
end

function AI:setState(s: string)
	if self.state == s then return end
	self.state = s
	self.model:SetAttribute("State", s)
	local run = self.root:FindFirstChild("Run")
	local growl = self.root:FindFirstChild("Growl")
	if s == "Chase" then
		self.hum.WalkSpeed = Config.MONSTER_CHASE
		if run then run.PlaybackSpeed = 1.15; run:Play() end
		local sc = self.root:FindFirstChild("Scream"); if sc then sc:Play() end
	elseif s == "Investigate" or s == "Locker" then
		self.hum.WalkSpeed = Config.MONSTER_INVESTIGATE
		if run then run.PlaybackSpeed = 0.8; run:Play() end
	else
		self.hum.WalkSpeed = Config.MONSTER_WALK
		if run then run.PlaybackSpeed = 0.6; run:Play() end
	end
	if growl and not growl.IsPlaying then growl:Play() end
	if s ~= "Chase" then
		self.target = nil
		self.model:SetAttribute("ChaseTarget", "")
	end
end

local function charOf(plr: Player)
	local c = plr.Character
	if not c then return nil end
	local r = c:FindFirstChild("HumanoidRootPart")
	local h = c:FindFirstChildOfClass("Humanoid")
	if not r or not h or h.Health <= 0 then return nil end
	return r
end

function AI:startChase(plr: Player)
	if not charOf(plr) then return end
	local wasChasing = self.state == "Chase"
	self.target = plr
	self.lastHeard = os.clock()
	if not wasChasing then self:setState("Chase") end
	self.model:SetAttribute("ChaseTarget", plr.Name)
end

-- Chamado pelo servidor sempre que alguém faz barulho
function AI:Hear(pos: Vector3, radius: number, plr: Player?)
	if not self.alive then return end
	local d = (pos - self.root.Position).Magnitude
	if d > radius then return end
	if self.state == "Chase" then
		if plr == self.target then
			self.lastKnown = pos; self.lastHeard = os.clock()
		elseif plr and d < 14 and self.target and charOf(self.target) and (charOf(self.target).Position - self.root.Position).Magnitude > d + 10 then
			self:startChase(plr) -- troca de alvo para o mais próximo/barulhento
		end
		return
	end
	if self.state == "Locker" then return end
	-- barulho alto e perto => perseguição direta
	if plr and d < radius * 0.45 and not plr:GetAttribute("Hiding") then
		self.lastKnown = pos
		self:startChase(plr)
		return
	end
	self.investigatePos = pos
	self.investigateUntil = os.clock() + 12
	self:setState("Investigate")
end

function AI:SuspectLocker(locker: Model, alreadyFailed: boolean)
	if not self.alive then return end
	if self.state == "Locker" then
		-- já indo para um armário: só atualiza se for o mesmo e agora falhou
		if self.locker == locker and alreadyFailed then self.lockerFailed = true end
		return
	end
	self.pauseUntil = 0
	self.locker = locker
	self.lockerFailed = alreadyFailed
	self:setState("Locker")
end

-- para tudo e escuta (usado enquanto alguém faz o minigame do armário)
function AI:Listen(pos: Vector3, dur: number)
	if not self.alive or self.state == "Chase" or self.state == "Locker" then return end
	self.pauseUntil = os.clock() + dur
	self.listening = true
	self.model:SetAttribute("Listening", true)
	local p = self.root.Position
	self.hum:MoveTo(p)
	self.root.CFrame = CFrame.lookAt(p, Vector3.new(pos.X, p.Y, pos.Z))
	local growl = self.root:FindFirstChild("Growl"); if growl then growl.PlaybackSpeed = 0.8 end
end

function AI:Release()
	if self.listening then
		self.listening = false
		self.model:SetAttribute("Listening", nil)
		self.pauseUntil = os.clock() + 0.6
		local growl = self.root:FindFirstChild("Growl"); if growl then growl.PlaybackSpeed = 1 end
	end
end

-- Movimento: linha reta quando livre, senão caminho pela grade de navegação (Nav)
function AI:floorPos(): Vector3
	return self.root.Position - Vector3.new(0, self.hum.HipHeight + self.root.Size.Y / 2, 0)
end

function AI:moveTo(goal: Vector3)
	local nav = self.ctx.nav
	local from = self.root.Position
	local fromFloor = self:floorPos()
	local goalFloor = Vector3.new(goal.X, fromFloor.Y, goal.Z)
	self.model:SetAttribute("Goal", goalFloor)
	local dir = goalFloor - fromFloor
	if dir.Magnitude < 0.5 then return end
	local now = os.clock()
	if dir.Magnitude < 70 and now > (self.forcePathUntil or 0) and nav:clearFloor(fromFloor, goalFloor) then
		self.wp = nil
		self.hum:MoveTo(Vector3.new(goal.X, from.Y, goal.Z))
		return
	end
	if not self.wp or not self.pathGoal or (self.pathGoal - goalFloor).Magnitude > 5 or now - self.pathTime > 1.0 then
		self.pathTime = now
		self.pathGoal = goalFloor
		self.wp = nav:path(fromFloor, goalFloor)
		self.wpIndex = 1
		if not self.wp then
			self.hum:MoveTo(Vector3.new(goal.X, from.Y, goal.Z))
			return
		end
	end
	local w = self.wp[self.wpIndex]
	while w and (Vector3.new(w.X, fromFloor.Y, w.Z) - fromFloor).Magnitude < 2.2 do
		self.wpIndex += 1
		w = self.wp[self.wpIndex]
	end
	if w then
		local nxt = self.wp[self.wpIndex + 1]
		if nxt and nav:clearFloor(fromFloor, nxt) then self.wpIndex += 1; w = nxt end
		self.hum:MoveTo(Vector3.new(w.X, from.Y, w.Z))
	else
		self.hum:MoveTo(Vector3.new(goal.X, from.Y, goal.Z))
	end
end

function AI:randomPoint(): Vector3
	local p = self.ctx.nav:randomNode()
	return p or self:floorPos()
end

function AI:tick()
	local now = os.clock()
	local pos = self.root.Position

	-- anti-travamento
	if (pos - self.lastPos).Magnitude < 0.3 and now > self.pauseUntil and self.state ~= "Locker" then
		self.stuckT += TICK
		if self.stuckT > 1.2 then
			-- preso numa quina: força pathfinding e dá um empurrão para trás
			self.wp = nil; self.pathTime = 0; self.stuckT = 0
			self.forcePathUntil = now + 4
			self.hum:MoveTo(pos - self.root.CFrame.LookVector * 3)
			if self.state == "Wander" and math.random() < 0.5 then self.wanderGoal = nil end
			return
		end
	else
		self.stuckT = 0
	end
	self.lastPos = pos

	-- sentido de proximidade: quem estiver muito perto e fora do armário é percebido
	if self.state ~= "Chase" and self.state ~= "Locker" then
		for _, plr in ipairs(self.ctx.getSurvivors()) do
			local r = charOf(plr)
			if r and not plr:GetAttribute("Hiding") and (r.Position - pos).Magnitude < Config.MONSTER_SENSE_RANGE * 0.6 then
				self:startChase(plr); break
			end
		end
	end

	if now < self.pauseUntil then self.hum:MoveTo(pos); return end

	if self.state == "Chase" then
		local plr = self.target
		local r = plr and charOf(plr)
		if not r then self:setState("Wander"); return end
		if plr:GetAttribute("Hiding") then
			local locker = self.ctx.lockerOf(plr)
			if locker and (r.Position - pos).Magnitude < 26 then
				-- viu (ouviu) você entrar
				self:SuspectLocker(locker, false)
			else
				self.investigatePos = r.Position; self.investigateUntil = now + 8
				self:setState("Investigate")
			end
			return
		end
		local d = (r.Position - pos).Magnitude
		if d < Config.MONSTER_SENSE_RANGE then self.lastKnown = r.Position; self.lastHeard = now end
		if d <= Config.MONSTER_KILL_RANGE then
			self.ctx.kill(plr, self.model)
			self.pauseUntil = now + 2.5
			self:setState("Wander")
			return
		end
		if now - self.lastHeard > 5 then
			self.investigatePos = self.lastKnown or r.Position; self.investigateUntil = now + 8
			self:setState("Investigate")
			return
		end
		-- prevê um pouco o movimento
		local goal = (now - self.lastHeard < 0.8) and (r.Position + r.AssemblyLinearVelocity * 0.25) or (self.lastKnown or r.Position)
		self:moveTo(goal)

	elseif self.state == "Investigate" then
		local goal = self.investigatePos
		if not goal or now > (self.investigateUntil or 0) then self:setState("Wander"); return end
		if (Vector3.new(goal.X, pos.Y, goal.Z) - pos).Magnitude < 4 then
			-- chegou: fareja e escuta
			self.pauseUntil = now + 2.2
			self.investigatePos = nil
			local locker = self.ctx.nearestOccupiedLocker(pos, 14)
			if locker and not (self.lockerCooldown[locker] and now < self.lockerCooldown[locker]) and math.random() < 0.6 then
				self:SuspectLocker(locker, false)
			else
				self:setState("Wander")
			end
			return
		end
		self:moveTo(goal)

	elseif self.state == "Locker" then
		local locker = self.locker
		if not locker or not locker.Parent then self:setState("Wander"); return end
		local back = locker.PrimaryPart
		local front = (back.CFrame * CFrame.new(0, 0, -5.5)).Position
		if (Vector3.new(front.X, pos.Y, front.Z) - pos).Magnitude > 3 then
			self:moveTo(front)
			return
		end
		if self.checking then return end
		self.checking = true
		self.hum:MoveTo(pos)
		-- encara o armário e escuta
		self.root.CFrame = CFrame.lookAt(pos, Vector3.new(back.Position.X, pos.Y, back.Position.Z))
		task.spawn(function()
			task.wait(1.2)
			local open = self.lockerFailed
			if not open then
				local passed = self.ctx.checkLocker(locker, "Hard")
				open = not passed
			end
			if not self.alive then return end
			if open then
				self.ctx.openLocker(locker, self.model)
				task.wait(1.5)
			else
				task.wait(0.8)
			end
			self.lockerCooldown[locker] = os.clock() + 15
			self.locker = nil
			self.checking = false
			self:setState("Wander")
		end)

	else -- Wander
		if not self.wanderGoal or (Vector3.new(self.wanderGoal.X, pos.Y, self.wanderGoal.Z) - pos).Magnitude < 4 then
			if self.wanderGoal then
				self.pauseUntil = now + math.random(10, 30) / 10
				-- às vezes ouve passos fracos de quem anda perto
				local locker = self.ctx.nearestOccupiedLocker(pos, Config.MONSTER_LOCKER_CHECK_RANGE)
				if locker and math.random() < 0.25 and not (self.lockerCooldown[locker] and now < self.lockerCooldown[locker]) then
					self:SuspectLocker(locker, false)
				end
			end
			self.wanderGoal = self:randomPoint()
			return
		end
		self:moveTo(self.wanderGoal)
	end
end

function AI:Start()
	self.root:SetNetworkOwner(nil)
	self.model:SetAttribute("State", "Wander")
	local run = self.root:FindFirstChild("Run"); if run then run.PlaybackSpeed = 0.6; run:Play() end
	local growl = self.root:FindFirstChild("Growl"); if growl then growl:Play() end
	task.spawn(function()
		while self.alive and self.model.Parent do
			local ok, err = pcall(self.tick, self)
			if not ok then warn("[Blinder AI]", err) end
			-- som de passos acompanha a velocidade real
			local run = self.root:FindFirstChild("Run")
			if run then run.Volume = math.clamp(self.root.AssemblyLinearVelocity.Magnitude / 10, 0, 1) * (self.state == "Chase" and 3 or 1.6) end
			task.wait(TICK)
		end
	end)
end

function AI:Destroy()
	self.alive = false
	if self.model then self.model:Destroy() end
end

return AI
