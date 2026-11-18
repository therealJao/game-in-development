-- BLINDER :: minigame do armário "PRENDA A RESPIRAÇÃO"
-- Um ponteiro gira num anel (como um batimento). Aperte ESPAÇO quando ele passar pela zona clara.
-- Errar ou deixar o fôlego acabar = o monstro escuta.
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TS = game:GetService("TweenService")
local K = require(script.Parent:WaitForChild("UIKit"))
local C, FF, new = K.C, K.Font, K.new

local M = {}
local running = false

local BONE = Color3.fromRGB(236, 226, 210)
local BLOOD = Color3.fromRGB(170, 12, 18)
local DOTS = 56
local RADIUS = 118

local function edgeShade(parent, z)
	-- bordas pretas grossas, como se a visão estivesse se fechando
	for _, e in ipairs({
		{ Vector2.new(0, 0), UDim2.fromScale(0, 0), UDim2.fromScale(1, 0.3), 90 },
		{ Vector2.new(0, 1), UDim2.fromScale(0, 1), UDim2.fromScale(1, 0.3), -90 },
		{ Vector2.new(0, 0), UDim2.fromScale(0, 0), UDim2.fromScale(0.25, 1), 0 },
		{ Vector2.new(1, 0), UDim2.fromScale(1, 0), UDim2.fromScale(0.25, 1), 180 },
	}) do
		new("Frame", { AnchorPoint = e[1], Position = e[2], Size = e[3], BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, ZIndex = z, Parent = parent },
			{ new("UIGradient", { Rotation = e[4], Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) }) }) })
	end
end

function M.run(gui: ScreenGui, difficulty: string, lungs: number, bonusMisses: number?): boolean
	if running then return false end
	running = true
	local hard = difficulty == "Hard"
	local needed = hard and 4 or 3
	local misses = (hard and 0 or 1) + (bonusMisses or 0)
	local speed = (hard and 250 or 185) * (1 - lungs * 0.05) -- graus por segundo
	local zoneDeg = (hard and 46 or 62) + lungs * 5
	local timeLimit = (hard and 6.5 or 8) + lungs * 0.4

	local root = new("Frame", { Name = "Minigame", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, ZIndex = 10, Parent = gui })
	K.tween(root, 0.35, { BackgroundTransparency = 0.45 })
	local shade = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 10, Parent = root })
	edgeShade(shade, 10)
	local pulse = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 11, Parent = root })
	edgeShade(pulse, 11)
	for _, f in ipairs(pulse:GetChildren()) do f.BackgroundColor3 = BLOOD end

	local center = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromOffset(RADIUS * 2 + 60, RADIUS * 2 + 60), BackgroundTransparency = 1, ZIndex = 12, Parent = root })
	-- disco escuro
	new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(RADIUS * 2 + 26, RADIUS * 2 + 26), BackgroundColor3 = Color3.fromRGB(8, 6, 8), BackgroundTransparency = 0.25, ZIndex = 12, Parent = center }, { K.corner(999), K.stroke(Color3.fromRGB(60, 10, 14), 2, 0.2) })
	-- coração no meio (bate mais rápido quando o fôlego acaba)
	local heart = K.label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.46), Size = UDim2.fromOffset(90, 90), Text = "♥", TextSize = 78, TextColor3 = BLOOD, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 14, Parent = center })
	local count = K.label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.66), Size = UDim2.fromOffset(160, 26), Text = "0 / " .. needed, FontFace = FF.num, TextSize = 24, TextColor3 = BONE, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 14, Parent = center })

	-- anel de pontos
	local dots = {}
	for i = 1, DOTS do
		local a = math.rad((i - 1) / DOTS * 360 - 90)
		dots[i] = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, math.cos(a) * RADIUS, 0.5, math.sin(a) * RADIUS), Size = UDim2.fromOffset(7, 7), BackgroundColor3 = Color3.fromRGB(70, 60, 62), BorderSizePixel = 0, ZIndex = 13, Parent = center }, { K.corner(4) })
	end
	-- ponteiro
	local needleHolder = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(RADIUS * 2 + 30, RADIUS * 2 + 30), BackgroundTransparency = 1, ZIndex = 15, Parent = center })
	local needle = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0), Size = UDim2.fromOffset(4, 36), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, ZIndex = 16, Parent = needleHolder }, { K.corner(2) })
	new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0, 0), Size = UDim2.fromOffset(12, 12), BackgroundColor3 = Color3.new(1, 1, 1), ZIndex = 16, Parent = needle }, { K.corner(6) })

	local title = K.label({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 0.52, -RADIUS - 40), Size = UDim2.fromOffset(700, 60), Text = "PRENDA A RESPIRAÇÃO", FontFace = FF.title, TextSize = 52, TextColor3 = BONE, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.4, ZIndex = 14, Parent = root })
	local info = K.label({ AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0.52, RADIUS + 36), Size = UDim2.fromOffset(600, 20), Text = "[ESPAÇO] / clique quando o ponteiro passar na zona clara", FontFace = FF.bodyB, TextSize = 15, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 14, Parent = root })
	-- barra de fôlego
	local breathBox = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0.52, RADIUS + 64), Size = UDim2.fromOffset(320, 10), BackgroundColor3 = Color3.fromRGB(20, 16, 18), ZIndex = 14, Parent = root }, { K.corner(5), K.stroke(BONE, 1, 0.75) })
	local breath = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(140, 190, 230), BorderSizePixel = 0, ZIndex = 15, Parent = breathBox }, { K.corner(5) })
	K.label({ AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 1, 4), Size = UDim2.fromOffset(200, 14), Text = "FÔLEGO", FontFace = FF.bodyB, TextSize = 11, TextColor3 = C.faint, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 14, Parent = breathBox })
	-- sussurros
	local whisper = K.label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.2), Size = UDim2.fromOffset(700, 24), Text = "", FontFace = FF.bodyM, TextSize = 18, TextColor3 = Color3.fromRGB(160, 40, 40), TextTransparency = 1, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 14, Parent = root })
	local WHISPERS = { "...ele está do lado de fora...", "não respire.", "ele sente o seu medo", "shhh...", "ele está ouvindo seu coração" }

	local zoneStart = 0
	local function placeZone()
		zoneStart = math.random(40, 320)
		for i, d in ipairs(dots) do
			local deg = (i - 1) / DOTS * 360
			local inZone = ((deg - zoneStart) % 360) < zoneDeg
			d.BackgroundColor3 = inZone and BONE or Color3.fromRGB(70, 60, 62)
			d.Size = inZone and UDim2.fromOffset(11, 11) or UDim2.fromOffset(7, 7)
		end
	end
	placeZone()

	local hits, missCount = 0, 0
	local elapsed = 0
	local angle = 0
	local result: boolean? = nil
	local beatT = 0
	local whisperT = 1.5

	local conn = RunService.RenderStepped:Connect(function(dt)
		elapsed += dt
		angle = (angle + speed * dt) % 360
		needleHolder.Rotation = angle
		local left = math.clamp(1 - elapsed / timeLimit, 0, 1)
		breath.Size = UDim2.fromScale(left, 1)
		breath.BackgroundColor3 = Color3.fromRGB(140, 190, 230):Lerp(BLOOD, 1 - left)
		-- batimento acelera conforme o fôlego acaba
		local bpm = 70 + (1 - left) * 110
		beatT += dt * bpm / 60
		local beat = math.max(0, math.sin(beatT * math.pi * 2)) ^ 6
		heart.TextSize = 70 + beat * 18
		for _, f in ipairs(pulse:GetChildren()) do
			local g = f:FindFirstChildOfClass("UIGradient")
			if g then g.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1 - beat * (0.25 + (1 - left) * 0.5)), NumberSequenceKeypoint.new(1, 1) }) end
		end
		-- visão tremendo
		local shake = math.floor((1 - left) * 6)
		center.Position = UDim2.new(0.5, math.random(-shake, shake), 0.52, math.random(-shake, shake))
		whisperT -= dt
		if whisperT <= 0 then
			whisperT = 1.8 + math.random() * 1.5
			whisper.Text = WHISPERS[math.random(#WHISPERS)]
			whisper.TextTransparency = 0.2
			K.tween(whisper, 1.4, { TextTransparency = 1 })
		end
		if elapsed >= timeLimit and result == nil then result = false end
	end)

	local inputConn = UIS.InputBegan:Connect(function(input, gp)
		if result ~= nil then return end
		if input.KeyCode == Enum.KeyCode.Space or input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch or input.KeyCode == Enum.KeyCode.ButtonA then
			if ((angle - zoneStart) % 360) < zoneDeg then
				hits += 1
				count.Text = hits .. " / " .. needed
				needle.BackgroundColor3 = C.green
				TS:Create(needle, TweenInfo.new(0.25), { BackgroundColor3 = Color3.new(1, 1, 1) }):Play()
				heart.TextColor3 = BONE; TS:Create(heart, TweenInfo.new(0.3), { TextColor3 = BLOOD }):Play()
				if hits >= needed then result = true else placeZone(); speed *= 1.1 end
			else
				missCount += 1
				root.BackgroundColor3 = BLOOD; root.BackgroundTransparency = 0.3
				TS:Create(root, TweenInfo.new(0.35), { BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45 }):Play()
				title.Text = "...!"
				task.delay(0.4, function() if result == nil then title.Text = "PRENDA A RESPIRAÇÃO" end end)
				if missCount > misses then result = false end
			end
		end
	end)

	while result == nil and gui.Parent do task.wait() end
	conn:Disconnect(); inputConn:Disconnect()
	if result then
		title.Text = "...SILÊNCIO"; title.TextColor3 = Color3.fromRGB(150, 200, 230)
	else
		title.Text = "ELE OUVIU VOCÊ"; title.TextColor3 = BLOOD
		root.BackgroundColor3 = Color3.fromRGB(90, 0, 0); root.BackgroundTransparency = 0.2
	end
	task.delay(0.6, function() K.tween(root, 0.4, { BackgroundTransparency = 1 }) end)
	task.delay(1.0, function() root:Destroy() end)
	running = false
	return result == true
end

return M
