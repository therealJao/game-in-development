-- BLINDER :: tela inicial (menu principal com o lobby ao fundo e o jogador na cena)
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TS = game:GetService("TweenService")
local UIS = game:GetService("UserInputService")
local RS = game:GetService("ReplicatedStorage")
local K = require(script.Parent:WaitForChild("UIKit"))
local C, FF, new = K.C, K.Font, K.new

local Title = {}

-- ponto da cena: na praça da vila, com o chafariz e o farol ao fundo
local O = Vector3.new(0, 600, 0)
local SPOT = O + Vector3.new(0, 3.2, 22)
local FACE = Vector3.new(-0.3, 0, 1)
local function shotCF(t: number): CFrame
	local sway = math.sin(t * 0.18)
	local camPos = O + Vector3.new(-4.6 + sway * 1.4, 4.6 + math.sin(t * 0.13) * 0.25, 33.4 + math.cos(t * 0.15) * 0.6)
	local look = O + Vector3.new(-1.2 + sway * 0.4, 6.4, 20)
	return CFrame.lookAt(camPos, look)
end

function Title.run(player: Player, hud, Menu, onPlay: () -> ())
	local camera = workspace.CurrentCamera
	local pg = player:WaitForChild("PlayerGui")
	local gui = new("ScreenGui", { Name = "BlinderTitle", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = 4, Parent = pg })
	local scale = new("UIScale", { Parent = gui })
	local function rescale()
		local vs = camera.ViewportSize
		scale.Scale = math.clamp(math.min(vs.X / 1600, vs.Y / 900), 0.6, 1.2)
	end
	rescale(); camera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
	new("TextButton", { Name = "Modal", Modal = true, Text = "", BackgroundTransparency = 1, Size = UDim2.fromOffset(0, 0), Parent = gui })

	-- escurecimento à esquerda para leitura + barras de cinema
	local shade = new("Frame", { Size = UDim2.new(0.62, 0, 1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0, Parent = gui },
		{ new("UIGradient", { Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.15), NumberSequenceKeypoint.new(0.55, 0.55), NumberSequenceKeypoint.new(1, 1) }) }) })
	local topBar = new("Frame", { Size = UDim2.new(1, 0, 0, 0), BackgroundColor3 = Color3.new(0, 0, 0), Parent = gui })
	local botBar = new("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 0), BackgroundColor3 = Color3.new(0, 0, 0), Parent = gui })
	local fade = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0, ZIndex = 50, Parent = gui })

	local root = new("Frame", { Name = "Root", Position = UDim2.fromOffset(96, 0), Size = UDim2.new(0, 560, 1, 0), BackgroundTransparency = 1, Parent = gui })
	local logo = K.label({ Position = UDim2.new(0, -6, 0.16, 0), Size = UDim2.fromOffset(620, 130), Text = "BLINDER", FontFace = FF.logo, TextSize = 132, TextColor3 = C.red, TextStrokeColor3 = Color3.fromRGB(60, 0, 0), TextStrokeTransparency = 0.4, Parent = root })
	local tag = K.label({ Position = UDim2.new(0, 2, 0.16, 132), Size = UDim2.fromOffset(560, 24), Text = "ELE NÃO VÊ.  ELE OUVE.", FontFace = FF.bodyB, TextSize = 20, TextColor3 = C.dim, Parent = root })
	new("Frame", { Position = UDim2.new(0, 2, 0.16, 166), Size = UDim2.fromOffset(64, 2), BackgroundColor3 = C.red, Parent = root })

	local list = new("Frame", { Name = "Menu", Position = UDim2.new(0, 0, 0.16, 200), Size = UDim2.fromOffset(460, 420), BackgroundTransparency = 1, Parent = root }, { K.list(Enum.FillDirection.Vertical, 2) })
	local descL = K.label({ Position = UDim2.new(0, 2, 0.16, 590), Size = UDim2.fromOffset(460, 40), Text = "", FontFace = FF.body, TextSize = 16, TextColor3 = C.faint, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = root })

	local ENTRIES = {
		{ id = "Play", label = "JOGAR", desc = "Entrar na vila. Quando a noite chegar: quebre, junte dinheiro e fuja antes que ele te ouça.", big = true },
		{ id = "Upgrades", label = "LOJA", desc = "Melhorias permanentes de fôlego, velocidade, força e resistência." },
		{ id = "Skills", label = "HABILIDADES", desc = "Árvores de talentos do sobrevivente e do monstro." },
		{ id = "Monsters", label = "MONSTROS", desc = "Compre e escolha o monstro que você vira. Cada um tem sua habilidade." },
		{ id = "Settings", label = "CONFIGURAÇÕES", desc = "Som, campo de visão e câmera." },
		{ id = "Credits", label = "CRÉDITOS", desc = "Quem fez esse pesadelo." },
	}
	local done = false
	local credits
	local function playClicked()
		if done then return end
		done = true
		Menu.toggle(false)
		K.tween(root, 0.5, { Position = UDim2.fromOffset(40, 0) })
		for _, d in ipairs(root:GetDescendants()) do
			if d:IsA("TextLabel") or d:IsA("TextButton") then K.tween(d, 0.4, { TextTransparency = 1 }) end
			if d:IsA("Frame") then K.tween(d, 0.4, { BackgroundTransparency = 1 }) end
		end
		K.tween(shade, 0.8, { BackgroundTransparency = 1 })
		K.tween(topBar, 0.6, { Size = UDim2.new(1, 0, 0, 0) }); K.tween(botBar, 0.6, { Size = UDim2.new(1, 0, 0, 0) })
		-- câmera voa até a cabeça do personagem
		local char = player.Character
		local head = char and char:FindFirstChild("Head")
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if head and hrp then
			local look = hrp.CFrame.LookVector
			local target = CFrame.lookAt(head.Position + Vector3.new(0, 0.25, 0), head.Position + Vector3.new(0, 0.25, 0) + look)
			local cv = Instance.new("CFrameValue"); cv.Value = camera.CFrame
			local conn = cv:GetPropertyChangedSignal("Value"):Connect(function() camera.CFrame = cv.Value end)
			local tw = TS:Create(cv, TweenInfo.new(1.7, Enum.EasingStyle.Quint, Enum.EasingDirection.InOut), { Value = target })
			K.tween(camera, 1.7, { FieldOfView = 72 }, Enum.EasingStyle.Quint, Enum.EasingDirection.InOut)
			Title.flying = true
			tw:Play(); tw.Completed:Wait()
			conn:Disconnect(); cv:Destroy()
		end
		Title.active = false
		Title.flying = false
		camera.CameraType = Enum.CameraType.Custom
		if char and char:FindFirstChildOfClass("Humanoid") then camera.CameraSubject = char:FindFirstChildOfClass("Humanoid") end
		gui:Destroy()
		onPlay()
	end

	local buttons = {}
	for i, e in ipairs(ENTRIES) do
		local h = e.big and 66 or 46
		local b = new("TextButton", { Name = "Btn_" .. e.id, LayoutOrder = i, AutoButtonColor = false, Text = "", Size = UDim2.fromOffset(440, h), BackgroundTransparency = 1, Parent = list })
		local bar = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 0, 0.5, 0), Size = UDim2.fromOffset(e.big and 4 or 0, e.big and 34 or 20), BackgroundColor3 = C.red, Parent = b })
		local t = K.label({ Position = UDim2.fromOffset(e.big and 18 or 0, 0), Size = UDim2.new(1, -20, 1, 0), Text = e.label, FontFace = e.big and FF.title or FF.head, TextSize = e.big and 44 or 24, TextColor3 = e.big and C.text or C.dim, Parent = b })
		local arrow = K.label({ AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -20, 0.5, 0), Size = UDim2.fromOffset(40, 40), Text = "›", FontFace = FF.title, TextSize = e.big and 44 or 30, TextColor3 = C.red, TextTransparency = 1, TextXAlignment = Enum.TextXAlignment.Right, Parent = b })
		b.MouseEnter:Connect(function()
			if done then return end
			K.tween(t, 0.15, { TextColor3 = C.text, Position = UDim2.fromOffset((e.big and 18 or 0) + 14, 0) })
			K.tween(bar, 0.15, { Size = UDim2.fromOffset(4, e.big and 34 or 20) })
			K.tween(arrow, 0.15, { TextTransparency = 0 })
			descL.Text = e.desc
			if K.onClick then end
		end)
		b.MouseLeave:Connect(function()
			if done then return end
			K.tween(t, 0.2, { TextColor3 = e.big and C.text or C.dim, Position = UDim2.fromOffset(e.big and 18 or 0, 0) })
			K.tween(bar, 0.2, { Size = UDim2.fromOffset(e.big and 4 or 0, e.big and 34 or 20) })
			K.tween(arrow, 0.2, { TextTransparency = 1 })
		end)
		b.MouseButton1Click:Connect(function()
			if done then return end
			if K.onClick then K.onClick() end
			if e.id == "Play" then task.spawn(playClicked)
			elseif e.id == "Credits" then credits.Visible = not credits.Visible
			else Menu.toggle(true, e.id) end
		end)
		buttons[e.id] = b
	end

	-- atalhos: Enter / Espaço / botão A do controle também começam o jogo
	local GuiService = game:GetService("GuiService")
	local inputConn
	inputConn = UIS.InputBegan:Connect(function(input, gp)
		if done then if inputConn then inputConn:Disconnect() end return end
		if Menu.open then return end
		local kc = input.KeyCode
		if kc == Enum.KeyCode.Return or kc == Enum.KeyCode.KeypadEnter or kc == Enum.KeyCode.ButtonStart
			or (kc == Enum.KeyCode.Space and not gp) or (kc == Enum.KeyCode.ButtonA and GuiService.SelectedObject == nil) then
			if K.onClick then K.onClick() end
			task.spawn(playClicked)
		end
	end)
	-- controle: deixa o JOGAR selecionado para navegar com o direcional
	local function selectForGamepad()
		if UIS.GamepadEnabled and not done then GuiService.SelectedObject = buttons.Play end
	end
	UIS.GamepadConnected:Connect(selectForGamepad)
	task.delay(2.2, selectForGamepad)
	-- dica de como começar, conforme o aparelho
	local startHint = K.label({ Position = UDim2.new(0, 2, 0.16, 516), Size = UDim2.fromOffset(460, 18), Text = "", FontFace = FF.bodyM, TextSize = 14, TextColor3 = C.faint, Parent = root })
	local function refreshHint()
		local last = UIS:GetLastInputType()
		if last == Enum.UserInputType.Touch then startHint.Text = "toque em JOGAR"
		elseif tostring(last):find("Gamepad") then startHint.Text = "aperte A para jogar"
		else startHint.Text = "clique em JOGAR ou aperte ENTER" end
	end
	refreshHint()
	UIS.LastInputTypeChanged:Connect(refreshHint)

	-- créditos
	credits = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 560, 0.55, 0), Size = UDim2.fromOffset(420, 260), BackgroundColor3 = C.bg, BackgroundTransparency = 0.15, Visible = false, Parent = gui }, { K.corner(6), K.stroke(C.line, 1, 0.9), K.pad(24) })
	K.list(Enum.FillDirection.Vertical, 8).Parent = credits
	for i, l in ipairs({
		{ "BLINDER", FF.title, 28, C.red },
		{ "Terror cooperativo para até 20 jogadores.", FF.body, 16, C.text },
		{ "Ideia e direção: o criador do jogo", FF.bodyM, 15, C.dim },
		{ "Programação, mapas e interface: feitos no Roblox Studio", FF.bodyM, 15, C.dim },
		{ "Modelos 3D do martelo e da lanterna: geração 3D do Roblox", FF.bodyM, 15, C.dim },
		{ "Sons: Roblox Creator Store", FF.bodyM, 15, C.dim },
	}) do
		K.label({ LayoutOrder = i, Size = UDim2.new(1, 0, 0, l[3] + 8), Text = l[1], FontFace = l[2], TextSize = l[3], TextColor3 = l[4], TextWrapped = true, Parent = credits })
	end

	-- cartão do jogador (baixo esquerda) e status do servidor (baixo direita)
	local card = new("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 96, 1, -56), Size = UDim2.fromOffset(330, 64), BackgroundTransparency = 1, Parent = gui })
	local av = new("ImageLabel", { Size = UDim2.fromOffset(56, 56), Position = UDim2.fromOffset(0, 4), BackgroundColor3 = C.panel2, Parent = card }, { K.corner(28) })
	task.spawn(function()
		local ok, img = pcall(function() return Players:GetUserThumbnailAsync(player.UserId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size150x150) end)
		if ok then av.Image = img end
	end)
	K.label({ Position = UDim2.fromOffset(70, 8), Size = UDim2.fromOffset(260, 24), Text = player.DisplayName, FontFace = FF.head, TextSize = 20, Parent = card })
	local info = K.label({ Position = UDim2.fromOffset(70, 32), Size = UDim2.fromOffset(260, 20), Text = "", FontFace = FF.bodyM, TextSize = 14, TextColor3 = C.dim, Parent = card })
	local status = K.label({ AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -64, 1, -86), Size = UDim2.fromOffset(420, 20), Text = "", FontFace = FF.bodyB, TextSize = 15, TextColor3 = C.text, TextXAlignment = Enum.TextXAlignment.Right, Parent = gui })
	local ver = K.label({ AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -64, 1, -62), Size = UDim2.fromOffset(420, 18), Text = "v0.4  ·  ALPHA", FontFace = FF.body, TextSize = 13, TextColor3 = C.faint, TextXAlignment = Enum.TextXAlignment.Right, Parent = gui })

	-- ===== câmera e personagem na cena =====
	Title.active = true
	camera.CameraType = Enum.CameraType.Scriptable
	camera.FieldOfView = 46
	local function placeCharacter(char: Model)
		local hrp = char:WaitForChild("HumanoidRootPart", 5)
		if not hrp or not Title.active then return end
		char:PivotTo(CFrame.lookAt(SPOT, SPOT + FACE))
		local hum = char:FindFirstChildOfClass("Humanoid")
		if hum then hum.WalkSpeed = 0; hum.JumpHeight = 0; hum.AutoRotate = false end
	end
	if player.Character then task.spawn(placeCharacter, player.Character) end
	local charConn = player.CharacterAdded:Connect(function(c) task.spawn(placeCharacter, c) end)

	local t0 = os.clock()
	RunService:BindToRenderStep("BlinderTitle", Enum.RenderPriority.Camera.Value + 5, function()
		if not Title.active then
			RunService:UnbindFromRenderStep("BlinderTitle")
			charConn:Disconnect()
			local char = player.Character
			local hum = char and char:FindFirstChildOfClass("Humanoid")
			if hum then hum.JumpHeight = game:GetService("StarterPlayer").CharacterJumpHeight; hum.AutoRotate = true end
			return
		end
		local t = os.clock() - t0
		camera.CameraType = Enum.CameraType.Scriptable
		if not Title.flying then camera.CFrame = shotCF(t) end
		-- mantém o personagem de frente para a câmera
		local c = player.Character
		local hrp = c and c:FindFirstChild("HumanoidRootPart")
		if hrp and not Title.flying and (hrp.Position - SPOT).Magnitude < 8 then
			local p = hrp.Position
			local want = CFrame.lookAt(p, p + FACE)
			if hrp.CFrame.LookVector:Dot(want.LookVector) < 0.995 then hrp.CFrame = want end
		end
		-- personagem sempre visível na cena
		local char = player.Character
		if char then
			for _, d in ipairs(char:GetDescendants()) do
				if d:IsA("BasePart") or d:IsA("Decal") then (d :: any).LocalTransparencyModifier = 0 end
			end
		end
		UIS.MouseIconEnabled = true
		-- garante o cursor livre (primeira pessoa travaria o mouse no centro)
		UIS.MouseBehavior = Enum.MouseBehavior.Default
		-- textos dinâmicos
		info.Text = "NÍVEL " .. (player:GetAttribute("Level") or 1) .. "   ·   $" .. K.fmt(player:GetAttribute("Money") or 0)
		local phase = RS.Blinder:GetAttribute("Phase")
		local tl = RS.Blinder:GetAttribute("TimeLeft") or 0
		local ts = string.format("%d:%02d", math.floor(tl / 60), tl % 60)
		status.Text = (#Players:GetPlayers()) .. " NO SERVIDOR   ·   " .. (phase == "Round" and ("NOITE EM CURSO  " .. ts) or ("PRÓXIMA NOITE  " .. ts))
	end)

	-- entrada cinematográfica
	topBar.Size = UDim2.new(1, 0, 0.12, 0); botBar.Size = UDim2.new(1, 0, 0.12, 0)
	K.tween(topBar, 2.2, { Size = UDim2.new(1, 0, 0, 34) }); K.tween(botBar, 2.2, { Size = UDim2.new(1, 0, 0, 34) })
	K.tween(fade, 2.0, { BackgroundTransparency = 1 }, Enum.EasingStyle.Quad)
	logo.TextTransparency = 1; tag.TextTransparency = 1
	task.delay(0.6, function() K.tween(logo, 1.4, { TextTransparency = 0 }) end)
	task.delay(1.1, function() K.tween(tag, 1.2, { TextTransparency = 0 }) end)
	-- tremidinha no logo de vez em quando
	task.spawn(function()
		while gui.Parent do
			task.wait(2 + math.random() * 4)
			if not gui.Parent or done then break end
			for _ = 1, 4 do
				logo.Position = UDim2.new(0, -6 + math.random(-4, 4), 0.16, math.random(-2, 2))
				logo.TextTransparency = math.random() * 0.4
				task.wait(0.04)
			end
			logo.Position = UDim2.new(0, -6, 0.16, 0); logo.TextTransparency = 0
		end
	end)
	Title.gui = gui
	return gui
end

return Title
