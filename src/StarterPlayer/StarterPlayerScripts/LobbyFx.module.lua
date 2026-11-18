-- BLINDER :: atmosfera do lobby e troca de iluminação (lobby x mapa)
local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local CS = game:GetService("CollectionService")
local TS = game:GetService("TweenService")
local RS = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")
local Config = require(RS:WaitForChild("Blinder"):WaitForChild("Config"))
local Shared = RS.Blinder
local Settings = require(script.Parent:WaitForChild("Settings"))

local Fx = {}
local player = Players.LocalPlayer

-- ===== presets de iluminação =====
local PRESETS = {
	-- noite dentro do mapa: breu de verdade. Só as lâmpadas, a lanterna e um resto de visão
	Round = {
		L = { ClockTime = 0, Brightness = 0, Ambient = Color3.fromRGB(10, 9, 13), OutdoorAmbient = Color3.fromRGB(6, 6, 9), FogColor = Color3.fromRGB(2, 2, 4), FogStart = 4, FogEnd = 85, ExposureCompensation = -0.35, EnvironmentDiffuseScale = 0.05, EnvironmentSpecularScale = 0.25 },
		Clouds = false,
		Atmosphere = { Density = 0.5, Color = Color3.fromRGB(8, 8, 12), Decay = Color3.fromRGB(2, 2, 4), Haze = 2.5, Glare = 0 },
		Grade = { Saturation = -0.42, Contrast = 0.32, Brightness = -0.03, TintColor = Color3.fromRGB(205, 210, 230) },
		Bloom = { Intensity = 0.9, Size = 30, Threshold = 1.1 },
		DOF = { FarIntensity = 0.35, FocusDistance = 18, InFocusRadius = 22 },
		Sky = { StarCount = 0, CelestialBodiesShown = false },
	},
	-- lobby: meia-noite sob a lua de sangue, névoa avermelhada
	Lobby = {
		L = { ClockTime = 0.2, Brightness = 0.6, Ambient = Color3.fromRGB(34, 24, 34), OutdoorAmbient = Color3.fromRGB(46, 30, 40), FogColor = Color3.fromRGB(22, 8, 12), FogStart = 30, FogEnd = 320, ExposureCompensation = -0.1, EnvironmentDiffuseScale = 0.35, EnvironmentSpecularScale = 0.6 },
		Clouds = true,
		Atmosphere = { Density = 0.42, Color = Color3.fromRGB(70, 22, 30), Decay = Color3.fromRGB(30, 4, 8), Haze = 2.2, Glare = 0.6 },
		Grade = { Saturation = -0.12, Contrast = 0.22, Brightness = -0.02, TintColor = Color3.fromRGB(255, 205, 205) },
		Bloom = { Intensity = 1.1, Size = 32, Threshold = 1.0 },
		DOF = { FarIntensity = 0.2, FocusDistance = 60, InFocusRadius = 70 },
		Sky = { StarCount = 1200, CelestialBodiesShown = true },
	},
}

local current = nil
local function apply(name: string, instant: boolean?)
	if current == name then return end
	current = name
	local p = PRESETS[name]
	local ti = TweenInfo.new(instant and 0 or 1.2, Enum.EasingStyle.Quad)
	TS:Create(Lighting, ti, p.L):Play()
	local atm = Lighting:FindFirstChildOfClass("Atmosphere"); if atm then TS:Create(atm, ti, p.Atmosphere):Play() end
	local grade = Lighting:FindFirstChild("Grade"); if grade then TS:Create(grade, ti, p.Grade):Play() end
	local bloom = Lighting:FindFirstChildOfClass("BloomEffect"); if bloom then TS:Create(bloom, ti, p.Bloom):Play() end
	local dof = Lighting:FindFirstChildOfClass("DepthOfFieldEffect"); if dof then TS:Create(dof, ti, p.DOF):Play() end
	local clouds = workspace.Terrain:FindFirstChildOfClass("Clouds")
	if clouds then clouds.Enabled = p.Clouds and true or false end
	local sky = Lighting:FindFirstChildOfClass("Sky")
	if sky then
		sky.StarCount = p.Sky.StarCount; sky.CelestialBodiesShown = p.Sky.CelestialBodiesShown
		sky.MoonAngularSize = 24
	end
end
Fx.apply = apply

function Fx.inLobby(): boolean
	local c = player.Character
	local r = c and c:FindFirstChild("HumanoidRootPart")
	local cam = workspace.CurrentCamera
	local y = (cam and cam.CFrame.Position.Y) or (r and r.Position.Y) or 600
	return y > 400
end

-- ===== sons do lobby =====
local night = Instance.new("Sound"); night.SoundId = Config.Sounds.Night; night.Looped = true; night.Volume = 0; night.Parent = SoundService; night:Play()
local music = Instance.new("Sound"); music.SoundId = Config.Sounds.MusicBox; music.Looped = true; music.Volume = 0; music.Parent = SoundService; music:Play()

-- ===== estátuas da galeria respirando =====
local gallery = {}
local function trackGallery(m: Model)
	local motors = {}
	for _, d in ipairs(m:GetDescendants()) do if d:IsA("Motor6D") then motors[d.Name] = d end end
	gallery[m] = { m = motors, t = math.random() * 10, tw = 0, twT = math.random() * 3, mesh = m:GetAttribute("RigKind") == "Mesh" }
end

function Fx.init()
	for _, m in ipairs(CS:GetTagged("GalleryMonster")) do trackGallery(m) end
	CS:GetInstanceAddedSignal("GalleryMonster"):Connect(trackGallery)
	apply(Fx.inLobby() and "Lobby" or "Round", true)

	local acc, bulbT, bulbStep = 0, 0, 0
	RunService.Heartbeat:Connect(function(dt)
		local lobby = Fx.inLobby()
		apply(lobby and "Lobby" or "Round")
		-- monstro-jogador: mundo mais fechado (ele é cego)
		if not lobby and player:GetAttribute("Role") == "Monster" then Lighting.FogEnd = 45 end
		night.Volume += ((lobby and 0.45 * Settings.sfx or 0) - night.Volume) * math.min(1, dt * 1.5)
		music.Volume += ((lobby and 0.22 * Settings.music or 0) - music.Volume) * math.min(1, dt * 1.5)
		music.PlaybackSpeed = 0.82 -- caixinha de música lenta e desafinada
		if not lobby then return end

		-- respiração e espasmos das estátuas
		for m, g in pairs(gallery) do
			if not m.Parent then gallery[m] = nil continue end
			g.t += dt
			g.twT -= dt
			if g.twT <= 0 then g.twT = 1.5 + math.random() * 4; g.tw = (math.random() - 0.5) * 0.9 end
			g.tw *= (1 - math.min(1, dt * 6))
			local b = math.sin(g.t * 1.6)
			local M = g.m
			if M.Waist then M.Waist.Transform = CFrame.Angles(-0.12 + b * 0.05, 0, 0) end
			if M.Neck then M.Neck.Transform = CFrame.Angles(b * 0.06 + g.tw * 0.4, math.sin(g.t * 0.5) * 0.35 + g.tw, g.tw * 0.6) end
			local sx = g.mesh and 0.16 or -0.25
			if M.LShoulder then M.LShoulder.Transform = CFrame.Angles(sx + b * 0.05, 0, -0.1) end
			if M.RShoulder then M.RShoulder.Transform = CFrame.Angles(sx - b * 0.05, 0, 0.1) end
			if g.mesh and M.RootJoint then M.RootJoint.Transform = CFrame.new(0, b * 0.06, 0) * CFrame.Angles(-0.1 - b * 0.03, 0, 0) end
			if M.LElbow then M.LElbow.Transform = CFrame.Angles(-0.4, 0, 0) end
			if M.RElbow then M.RElbow.Transform = CFrame.Angles(-0.4 + g.tw * 0.5, 0, 0) end
			if M.LKnee then M.LKnee.Transform = CFrame.Angles(-0.15, 0, 0) end
			if M.RKnee then M.RKnee.Transform = CFrame.Angles(-0.15, 0, 0) end
			if M.RootJoint then M.RootJoint.Transform = CFrame.new(0, b * 0.05 - 0.1, 0) end
		end

		-- velas, lanternas e janelas tremulando
		acc += dt
		if acc > 0.07 then
			acc = 0
			for _, c in ipairs(CS:GetTagged("Candle")) do
				local l = c:FindFirstChildWhichIsA("Light")
				if l then
					local base = l:GetAttribute("B") or l.Brightness
					if l:GetAttribute("B") == nil then l:SetAttribute("B", base) end
					l.Brightness = base * (0.75 + math.random() * 0.4)
				end
			end
			for _, w in ipairs(CS:GetTagged("LobbyWindow")) do
				if math.random() < 0.004 then
					local l = w:FindFirstChildWhichIsA("Light")
					local orig = w.Transparency
					w.Transparency = 0.9; if l then l.Enabled = false end
					task.delay(0.08 + math.random() * 0.25, function() w.Transparency = orig; if l then l.Enabled = true end end)
				end
			end
			for _, s in ipairs(CS:GetTagged("NeonSign")) do
				local gui = s:FindFirstChild("Gui")
				local title = gui and gui:FindFirstChild("Title")
				local l = s:FindFirstChildWhichIsA("Light")
				if title and math.random() < 0.02 then
					title.TextTransparency = 0.7; if l then l.Brightness = 0.6 end
					task.delay(0.05 + math.random() * 0.12, function() title.TextTransparency = 0; if l then l.Brightness = 2.2 end end)
				end
			end
		end
		-- lâmpadas do letreiro correndo
		bulbT += dt
		if bulbT > 0.18 then
			bulbT = 0; bulbStep += 1
			for i, b in ipairs(CS:GetTagged("MarqueeBulb")) do
				b.Transparency = ((i + bulbStep) % 3 == 0) and 0.75 or 0
			end
		end
	end)
end

-- atualiza o telão de status da mansão
function Fx.updateBoard(phase: string, timeLeft: number, mapName: string?)
	local lobby = workspace:FindFirstChild("Lobby")
	local board = lobby and lobby:FindFirstChild("StatusBoard", true)
	local gui = board and board:FindFirstChild("Gui")
	if not gui then return end
	local t = string.format("%d:%02d", math.floor(timeLeft / 60), timeLeft % 60)
	if phase == "Intermission" then
		gui.Title.Text = "PRÓXIMA NOITE"; gui.Status.Text = t; gui.Sub.Text = "Prepare-se. Compre melhorias no menu [M]."
	elseif phase == "Round" then
		gui.Title.Text = "NOITE EM CURSO"; gui.Status.Text = t; gui.Sub.Text = (mapName or "") .. "  •  [V] para espectar"
	else
		gui.Title.Text = "FIM DA NOITE"; gui.Status.Text = "--:--"; gui.Sub.Text = "Contando os sobreviventes..."
	end
end

return Fx
