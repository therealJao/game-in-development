-- BLINDER :: HUD (identidade própria: "olho + âmbar", medidores verticais, formas redondas)
local TS = game:GetService("TweenService")
local K = require(script.Parent:WaitForChild("UIKit"))
local C, FF = K.C, K.Font
local new = K.new

local AMBER = Color3.fromRGB(255, 176, 59)
local BONE = Color3.fromRGB(242, 234, 216)
local INK = Color3.fromRGB(12, 14, 18)

local Hud = {}

-- medidor vertical em cápsula (enche de baixo para cima)
local function vgauge(parent, order, icon, color)
	local col = new("Frame", { LayoutOrder = order, Size = UDim2.fromOffset(34, 196), BackgroundTransparency = 1, Parent = parent })
	local track = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 0), Size = UDim2.fromOffset(10, 156), BackgroundColor3 = INK, BackgroundTransparency = 0.35, ClipsDescendants = true, Parent = col }, { K.corner(5), K.stroke(BONE, 1, 0.8) })
	local fill = new("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.fromScale(1, 1), BackgroundColor3 = color, BorderSizePixel = 0, Parent = track }, { K.corner(5) })
	local ic = new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, 0), Size = UDim2.fromOffset(32, 32), BackgroundColor3 = INK, BackgroundTransparency = 0.3, Parent = col }, { K.corner(16), K.stroke(color, 1.5, 0.35) })
	K.label({ Size = UDim2.fromScale(1, 1), Text = icon, TextSize = 15, TextXAlignment = Enum.TextXAlignment.Center, Parent = ic })
	local shown = 1
	local function set(v: number)
		v = math.clamp(v, 0, 1)
		if math.abs(v - shown) < 0.004 then return end
		shown = v
		fill.Size = UDim2.fromScale(1, v)
	end
	return col, set, fill, ic
end

local function edge(parent, anchor, pos, size, rot, color)
	return new("Frame", { AnchorPoint = anchor, Position = pos, Size = size, BackgroundColor3 = color, Parent = parent },
		{ new("UIGradient", { Rotation = rot, Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 1) }) }) })
end

local function edges(parent, color, depth)
	edge(parent, Vector2.new(0, 0), UDim2.fromScale(0, 0), UDim2.fromScale(1, depth), 90, color)
	edge(parent, Vector2.new(0, 1), UDim2.fromScale(0, 1), UDim2.fromScale(1, depth), -90, color)
	edge(parent, Vector2.new(0, 0), UDim2.fromScale(0, 0), UDim2.fromScale(depth * 0.8, 1), 0, color)
	edge(parent, Vector2.new(1, 0), UDim2.fromScale(1, 0), UDim2.fromScale(depth * 0.8, 1), 180, color)
end

function Hud.init(player: Player?, parentOverride: Instance?)
	local pg = parentOverride or player:WaitForChild("PlayerGui")
	local old = pg:FindFirstChild("BlinderHUD"); if old then old:Destroy() end
	local gui = new("ScreenGui", { Name = "BlinderHUD", ResetOnSpawn = false, IgnoreGuiInset = true, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, DisplayOrder = 5, Parent = pg })
	local H = { gui = gui }
	local scale = new("UIScale", { Parent = gui })
	local function rescale()
		local cam = workspace.CurrentCamera
		local vs = cam and cam.ViewportSize or Vector2.new(1920, 1080)
		scale.Scale = math.clamp(math.min(vs.X / 1920, vs.Y / 1080), 0.55, 0.9)
	end
	rescale()
	if workspace.CurrentCamera then workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale) end

	-- ===== camadas de atmosfera =====
	local fx = new("Frame", { Name = "FX", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = gui })
	local vig = new("Frame", { Name = "Vignette", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = fx })
	edges(vig, Color3.new(0, 0, 0), 0.14)
	local fear = new("Frame", { Name = "Fear", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, Parent = fx })
	edges(fear, Color3.fromRGB(110, 0, 0), 0.2)
	H.fear = fear
	H.grain = new("Frame", { Name = "Grain", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.99, Parent = fx })
	H.flashFrame = new("Frame", { Name = "Flash", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(150, 0, 0), BackgroundTransparency = 1, ZIndex = 20, Parent = gui })

	-- ===== relógio (topo, centro): pílula compacta =====
	local clock = new("Frame", { Name = "Clock", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 10), Size = UDim2.fromOffset(210, 46), BackgroundColor3 = INK, BackgroundTransparency = 0.45, Parent = gui }, { K.corner(23), K.stroke(AMBER, 1, 0.6) })
	H.clockLabel = K.label({ Position = UDim2.fromOffset(0, 4), Size = UDim2.new(1, 0, 0, 12), Text = "LOBBY", FontFace = FF.bodyB, TextSize = 11, TextColor3 = AMBER, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.AtEnd, Parent = clock })
	H.clockTime = K.label({ Position = UDim2.fromOffset(0, 15), Size = UDim2.new(1, 0, 0, 28), Text = "0:00", FontFace = FF.num, TextSize = 26, TextColor3 = BONE, TextXAlignment = Enum.TextXAlignment.Center, Parent = clock })
	H.clockSub = K.label({ AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 60), Size = UDim2.fromOffset(420, 16), Text = "", FontFace = FF.bodyB, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.6, Parent = gui })
	H.clock = clock
	function H.setClock(label: string, time: string, sub: string?, subColor: Color3?)
		H.clockLabel.Text = label; H.clockTime.Text = time
		H.clockSub.Text = sub or ""
		H.clockSub.TextColor3 = subColor or C.dim
	end

	-- ===== dinheiro da rodada (topo, direita): pílula com moeda =====
	local money = new("Frame", { Name = "RoundMoney", AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, 12), Size = UDim2.fromOffset(170, 44), BackgroundColor3 = INK, BackgroundTransparency = 0.3, Parent = gui }, { K.corner(26), K.stroke(AMBER, 1.5, 0.4) })
	local coin = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 5, 0.5, 0), Size = UDim2.fromOffset(34, 34), BackgroundColor3 = AMBER, Parent = money }, { K.corner(20), K.stroke(Color3.fromRGB(150, 92, 20), 2, 0) })
	K.label({ Size = UDim2.fromScale(1, 1), Text = "$", FontFace = FF.num, TextSize = 24, TextColor3 = Color3.fromRGB(90, 52, 8), TextXAlignment = Enum.TextXAlignment.Center, Parent = coin })
	H.roundMoney = K.label({ Position = UDim2.fromOffset(44, 2), Size = UDim2.new(1, -58, 0, 26), Text = "$0", FontFace = FF.num, TextSize = 24, TextColor3 = BONE, TextXAlignment = Enum.TextXAlignment.Right, Parent = money })
	K.label({ Position = UDim2.fromOffset(44, 27), Size = UDim2.new(1, -58, 0, 12), Text = "BOLSA DA NOITE", FontFace = FF.bodyB, TextSize = 10, TextColor3 = AMBER, TextXAlignment = Enum.TextXAlignment.Right, Parent = money })
	H.moneyFrame = money
	local lastMoney = -1
	function H.setRoundMoney(n: number)
		if n == lastMoney then return end
		lastMoney = n
		H.roundMoney.Text = "$" .. K.fmt(n)
	end

	-- ===== status (canto inferior esquerdo, discreto): barras finas + itens =====
	local st = new("Frame", { Name = "Status", AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 18, 1, -18), Size = UDim2.fromOffset(230, 110), BackgroundTransparency = 1, Parent = gui })
	H.statusFrame = st
	local function hbar(y, label, color)
		K.label({ Position = UDim2.fromOffset(0, y), Size = UDim2.fromOffset(120, 12), Text = label, FontFace = FF.bodyB, TextSize = 10, TextColor3 = color, TextTransparency = 0.25, TextStrokeTransparency = 0.7, Parent = st })
		local track = new("Frame", { Position = UDim2.fromOffset(0, y + 14), Size = UDim2.fromOffset(180, 6), BackgroundColor3 = INK, BackgroundTransparency = 0.4, ClipsDescendants = true, Parent = st }, { K.corner(3) })
		local fill = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = color, BorderSizePixel = 0, Parent = track }, { K.corner(3) })
		local shown = 1
		return function(v)
			v = math.clamp(v, 0, 1)
			if math.abs(v - shown) < 0.004 then return end
			shown = v; fill.Size = UDim2.fromScale(v, 1)
		end, fill
	end
	local setSt, stFill = hbar(0, "FÔLEGO", BONE)
	local setHands, handsFill = hbar(26, "MÃOS", Color3.fromRGB(220, 70, 70))
	local handsWarn = K.label({ Position = UDim2.fromOffset(60, 26), Size = UDim2.fromOffset(120, 12), Text = "", FontFace = FF.bodyB, TextSize = 10, TextColor3 = C.red, TextXAlignment = Enum.TextXAlignment.Right, TextStrokeTransparency = 0.6, Parent = st })
	local chips = new("Frame", { Position = UDim2.fromOffset(0, 62), Size = UDim2.fromOffset(200, 44), BackgroundTransparency = 1, Parent = st }, { K.list(Enum.FillDirection.Horizontal, 14) })
	local function chip(order, icon, key)
		local f = new("Frame", { LayoutOrder = order, Size = UDim2.fromOffset(40, 40), BackgroundColor3 = INK, BackgroundTransparency = 0.45, Parent = chips }, { K.corner(20), K.stroke(AMBER, 1, 0.6) })
		K.label({ Size = UDim2.new(1, 0, 1, -4), Text = icon, TextSize = 16, TextXAlignment = Enum.TextXAlignment.Center, Parent = f })
		local badge = new("Frame", { AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, 8, 1, 4), Size = UDim2.fromOffset(26, 16), BackgroundColor3 = AMBER, Parent = f }, { K.corner(8) })
		local v = K.label({ Size = UDim2.fromScale(1, 1), Text = "0", FontFace = FF.num, TextSize = 11, TextColor3 = INK, TextXAlignment = Enum.TextXAlignment.Center, Parent = badge })
		local kc = K.key(f, key, UDim2.new(0.5, 0, 0, -6), Vector2.new(0.5, 0.5), key == "F" and "Y" or "RB")
		kc.TextSize = 11
		return f, v, badge
	end
	local bandChip, bandVal = chip(1, "🩹", "F")
	local lampChip, lampVal, lampBadge = chip(2, "🔦", "L")
	lampBadge.Size = UDim2.fromOffset(34, 16)
	lampChip.Visible = false
	local lastSt, lastEx = -1, nil
	function H.setStamina(v: number, exhausted: boolean)
		setSt(v)
		if exhausted ~= lastEx then lastEx = exhausted; stFill.BackgroundColor3 = exhausted and C.red or BONE end
	end
	function H.setHands(v: number)
		setHands(v)
		handsWarn.Text = v <= 0 and "SANGRANDO" or (v < 0.3 and "MACHUCADAS" or "")
	end
	function H.setBandages(n: number) bandVal.Text = tostring(n) end
	function H.setFlashlight(visible: boolean, pct: number, on: boolean)
		lampChip.Visible = visible
		if visible then
			lampVal.Text = math.floor(pct * 100) .. "%"
			lampBadge.BackgroundColor3 = on and AMBER or (pct < 0.2 and C.red or BONE)
		end
	end

	-- ===== mira e alvo =====
	-- mira: anel fino âmbar (sem ponto sólido)
	H.cross = new("Frame", { Name = "Crosshair", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(12, 12), BackgroundTransparency = 1, Parent = gui }, { K.corner(6), K.stroke(BONE, 1.5, 0.25) })
	new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(2, 2), BackgroundColor3 = AMBER, Parent = H.cross }, { K.corner(1) })
	local hitm = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(20, 20), BackgroundTransparency = 1, Parent = gui })
	for _, r in ipairs({ 45, -45, 135, -135 }) do
		new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(math.rad(r)) * 0.42, 0.5 + math.sin(math.rad(r)) * 0.42), Size = UDim2.fromOffset(7, 2), Rotation = r, BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 1, Parent = hitm })
	end
	function H.hitPulse(color: Color3?)
		for _, l in ipairs(hitm:GetChildren()) do
			l.BackgroundColor3 = color or Color3.new(1, 1, 1); l.BackgroundTransparency = 0
			K.tween(l, 0.3, { BackgroundTransparency = 1 })
		end
		hitm.Size = UDim2.fromOffset(28, 28); K.tween(hitm, 0.2, { Size = UDim2.fromOffset(20, 20) })
	end
	-- alvo: nome + vida em gomos (8 segmentos) + valor
	local tgt = new("Frame", { Name = "Target", AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0.5, 26, 0.5, 0), Size = UDim2.fromOffset(220, 52), BackgroundTransparency = 1, Visible = false, Parent = gui })
	local tgtName = K.label({ Size = UDim2.new(1, 0, 0, 18), Text = "", FontFace = FF.bodyB, TextSize = 15, TextColor3 = BONE, TextStrokeTransparency = 0.55, Parent = tgt })
	local pips = new("Frame", { Position = UDim2.fromOffset(0, 22), Size = UDim2.fromOffset(8 * 14, 6), BackgroundTransparency = 1, Parent = tgt }, { K.list(Enum.FillDirection.Horizontal, 3) })
	local pipList = {}
	for i = 1, 8 do
		pipList[i] = new("Frame", { LayoutOrder = i, Size = UDim2.fromOffset(11, 6), BackgroundColor3 = AMBER, Parent = pips }, { K.corner(3), K.stroke(INK, 1, 0.4) })
	end
	local tgtVal = K.label({ Position = UDim2.fromOffset(0, 32), Size = UDim2.new(1, 0, 0, 16), Text = "", FontFace = FF.bodyB, TextSize = 12, TextColor3 = AMBER, TextStrokeTransparency = 0.6, Parent = tgt })
	function H.setTarget(visible: boolean, name: string?, value: string?, hp: number?)
		tgt.Visible = visible
		if visible then
			tgtName.Text = name or ""; tgtVal.Text = value or ""
			local n = math.ceil(math.clamp(hp or 1, 0, 1) * 8)
			for i, p in ipairs(pipList) do p.BackgroundTransparency = i <= n and 0 or 0.8 end
		end
	end

	-- ===== notificações (direita) =====
	local feed = new("Frame", { Name = "Feed", AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, 96), Size = UDim2.fromOffset(290, 220), BackgroundTransparency = 1, Parent = gui },
		{ K.list(Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Right) })
	local order = 0
	local KIND = { money = C.gold, escape = C.gold, death = C.red, kill = C.red, monster = C.red, exits = C.green, item = C.teal, xp = C.purple, level = C.gold, info = C.dim }
	function H.notify(text: string, kind: string?)
		order += 1
		local color = KIND[kind or "info"] or C.dim
		local holder = new("Frame", { LayoutOrder = order, Size = UDim2.fromOffset(280, 30), BackgroundTransparency = 1, ClipsDescendants = false, Parent = feed })
		local f = new("Frame", { Position = UDim2.fromOffset(40, 0), Size = UDim2.fromScale(1, 1), BackgroundColor3 = INK, BackgroundTransparency = 1, Parent = holder }, { K.corner(18) })
		local acc = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 10, 0.5, 0), Size = UDim2.fromOffset(10, 10), BackgroundColor3 = color, BackgroundTransparency = 1, Parent = f }, { K.corner(5) })
		local l = K.label({ Position = UDim2.fromOffset(28, 0), Size = UDim2.new(1, -36, 1, 0), Text = text, FontFace = FF.bodyM, TextSize = 13, TextColor3 = BONE, TextTransparency = 1, TextTruncate = Enum.TextTruncate.AtEnd, Parent = f })
		K.tween(f, 0.35, { Position = UDim2.fromOffset(0, 0), BackgroundTransparency = 0.2 })
		K.tween(acc, 0.35, { BackgroundTransparency = 0 })
		K.tween(l, 0.35, { TextTransparency = 0 })
		task.delay(4.2, function()
			K.tween(f, 0.4, { Position = UDim2.fromOffset(40, 0), BackgroundTransparency = 1 })
			K.tween(acc, 0.4, { BackgroundTransparency = 1 })
			K.tween(l, 0.4, { TextTransparency = 1 })
			task.wait(0.45); holder:Destroy()
		end)
		local kids = {}
		for _, c in ipairs(feed:GetChildren()) do if c:IsA("Frame") then table.insert(kids, c) end end
		if #kids > 4 then kids[1]:Destroy() end
	end

	-- ===== banner cinematográfico =====
	local banner = new("Frame", { Name = "Banner", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.3), Size = UDim2.fromOffset(800, 100), BackgroundTransparency = 1, Visible = false, Parent = gui })
	local bTitle = K.label({ Size = UDim2.new(1, 0, 0, 52), Text = "", FontFace = FF.title, TextSize = 44, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.75, Parent = banner })
	local bLine = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 56), Size = UDim2.fromOffset(0, 6), BackgroundColor3 = C.red, Parent = banner }, { K.corner(3) })
	local bSub = K.label({ Position = UDim2.fromOffset(0, 66), Size = UDim2.new(1, 0, 0, 20), Text = "", FontFace = FF.bodyM, TextSize = 15, TextColor3 = C.text, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.7, Parent = banner })
	function H.showBanner(title: string, sub: string?, color: Color3?, dur: number?)
		banner.Visible = true
		bTitle.Text = title; bTitle.TextColor3 = color or C.text
		bSub.Text = sub or ""
		bLine.BackgroundColor3 = color or C.red
		bTitle.TextTransparency = 1; bSub.TextTransparency = 1; bLine.Size = UDim2.fromOffset(0, 6)
		banner.Position = UDim2.fromScale(0.5, 0.32)
		K.tween(banner, 0.8, { Position = UDim2.fromScale(0.5, 0.3) })
		K.tween(bTitle, 0.6, { TextTransparency = 0 })
		K.tween(bLine, 0.9, { Size = UDim2.fromOffset(60, 6) })
		task.delay(0.25, function() K.tween(bSub, 0.6, { TextTransparency = 0 }) end)
		local token = {}
		H._bannerToken = token
		task.delay(dur or 3, function()
			if H._bannerToken ~= token then return end
			K.tween(bTitle, 0.6, { TextTransparency = 1 }); K.tween(bSub, 0.6, { TextTransparency = 1 }); K.tween(bLine, 0.6, { Size = UDim2.fromOffset(0, 6) })
			task.wait(0.65)
			if H._bannerToken == token then banner.Visible = false end
		end)
	end

	function H.moneyPopup(amount: number)
		-- moedinha que voa até a bolsa (canto superior direito)
		local l = K.label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, math.random(-30, 30), 0.5, -30), Size = UDim2.fromOffset(120, 34), Text = "+$" .. amount, FontFace = FF.num, TextSize = 26, TextColor3 = AMBER, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.5, Parent = gui })
		K.tween(l, 0.9, { Position = UDim2.new(1, -120, 0, 50), TextTransparency = 1, TextStrokeTransparency = 1, TextSize = 16 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		game:GetService("Debris"):AddItem(l, 1)
		task.delay(0.75, function()
			H.roundMoney.TextSize = 34; K.tween(H.roundMoney, 0.35, { TextSize = 28 }, Enum.EasingStyle.Back)
		end)
	end

	-- ===== sangue na tela (respingos nas bordas que escorrem e secam) =====
	local bloodLayer = new("Frame", { Name = "BloodScreen", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 18, Parent = gui })
	local function drop(x: number, y: number, sz: number, dark: boolean)
		local col = dark and Color3.fromRGB(70, 2, 6) or Color3.fromRGB(125, 6, 12)
		local d = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(x, y), Size = UDim2.fromOffset(sz, sz * (0.75 + math.random() * 0.5)), Rotation = math.random(0, 360), BackgroundColor3 = col, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 18, Parent = bloodLayer }, { K.corner(999),
			new("UIGradient", { Rotation = math.random(0, 360), Color = ColorSequence.new(col:Lerp(Color3.new(0, 0, 0), 0.35), col), Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.8, 0.1), NumberSequenceKeypoint.new(1, 0.6) }) }) })
		-- brilho molhado
		new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.32, 0.3), Size = UDim2.fromScale(0.22, 0.14), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.82, ZIndex = 18, Parent = d }, { K.corner(999) })
		return d
	end
	function H.bloodScreen(intensity: number)
		intensity = math.clamp(intensity or 1, 0.2, 1.5)
		local items = {}
		local n = math.floor(5 + intensity * 7)
		for _ = 1, n do
			-- perto das bordas, nunca no meio da mira
			local edgeX = math.random() < 0.5
			local x = edgeX and (math.random() < 0.5 and math.random() * 0.16 or 1 - math.random() * 0.16) or math.random()
			local y = edgeX and math.random() or (math.random() < 0.5 and math.random() * 0.18 or 1 - math.random() * 0.18)
			local big = drop(x, y, math.random(40, 120) * intensity, math.random() < 0.4)
			table.insert(items, big)
			for _ = 1, math.random(3, 7) do
				local a = math.random() * math.pi * 2
				local r = math.random(30, 110) / 1000
				table.insert(items, drop(x + math.cos(a) * r, y + math.sin(a) * r * 1.6, math.random(6, 20), false))
			end
			-- escorrido
			if math.random() < 0.6 then
				local w = math.random(5, 12)
				local drip = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(x, y), Size = UDim2.fromOffset(w, 0), BackgroundColor3 = Color3.fromRGB(105, 4, 10), BackgroundTransparency = 0.15, BorderSizePixel = 0, ZIndex = 18, Parent = bloodLayer }, { K.corner(w) })
				K.tween(drip, 2.5 + math.random() * 2, { Size = UDim2.fromOffset(w, math.random(80, 260)) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
				table.insert(items, drip)
			end
		end
		-- seca e some aos poucos
		task.delay(3.5, function()
			for _, it in ipairs(items) do
				if it.Parent then
					K.tween(it, 2.5, { BackgroundTransparency = 1, BackgroundColor3 = Color3.fromRGB(45, 10, 10) })
					for _, c in ipairs(it:GetChildren()) do if c:IsA("Frame") then K.tween(c, 2, { BackgroundTransparency = 1 }) end end
				end
			end
			task.wait(2.6)
			for _, it in ipairs(items) do if it.Parent then it:Destroy() end end
		end)
	end
	-- ferido: bordas vermelhas pulsando com o coração
	local wound = new("Frame", { Name = "Wound", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 3, Parent = gui })
	edges(wound, Color3.fromRGB(120, 0, 6), 0.16)
	function H.setWounded(on: boolean, t: number)
		wound.Visible = on
		if on then
			local beat = math.max(0, math.sin(t * 5.5)) ^ 4
			for _, e in ipairs(wound:GetChildren()) do (e :: Frame).BackgroundTransparency = 0.55 - beat * 0.35 end
		end
	end

	function H.flash(color: Color3, from: number, dur: number)
		H.flashFrame.BackgroundColor3 = color; H.flashFrame.BackgroundTransparency = from
		K.tween(H.flashFrame, dur, { BackgroundTransparency = 1 }, Enum.EasingStyle.Quad)
	end

	-- ===== dica de controles =====
	H.hint = K.label({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -16), Size = UDim2.fromOffset(700, 18), Text = "", FontFace = FF.bodyM, TextSize = 13, TextColor3 = C.faint, TextXAlignment = Enum.TextXAlignment.Center, Parent = gui })

	-- ===== espectar =====
	local spec = new("Frame", { Name = "Spectate", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 22), Size = UDim2.fromOffset(380, 58), BackgroundColor3 = INK, BackgroundTransparency = 0.25, Visible = false, Parent = gui }, { K.corner(29), K.stroke(AMBER, 1.5, 0.5) })
	K.label({ Position = UDim2.fromOffset(0, 7), Size = UDim2.new(1, 0, 0, 14), Text = "ESPECTANDO", FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Center, Parent = spec })
	H.specName = K.label({ Position = UDim2.fromOffset(0, 22), Size = UDim2.new(1, 0, 0, 30), Text = "", FontFace = FF.head, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Center, Parent = spec })
	H.specPrev = K.button({ AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Size = UDim2.fromOffset(40, 40), Text = "‹", TextSize = 26, BackgroundColor3 = C.panel2, Parent = spec })
	H.specNext = K.button({ AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -8, 0.5, 0), Size = UDim2.fromOffset(40, 40), Text = "›", TextSize = 26, BackgroundColor3 = C.panel2, Parent = spec })
	H.spectate = spec

	-- ===== barra de habilidades do monstro =====
	local ab = new("Frame", { Name = "Abilities", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -22), Size = UDim2.fromOffset(5 * 56 + 20, 58), BackgroundTransparency = 1, Visible = false, Parent = gui },
		{ K.list(Enum.FillDirection.Horizontal, 8, Enum.HorizontalAlignment.Center) })
	H.abilityBar = ab
	H.abilitySlots = {}
	for i, a in ipairs({ { "Attack", "LMB", "ATACAR", "💀" }, { "Special", "R", "ESPECIAL", "★" }, { "Lunge", "Q", "INVESTIDA", "💨" }, { "Echo", "C", "ECO", "📡" }, { "Scream", "F", "GRITO", "🗣" } }) do
		local special = a[1] == "Special"
		local sz = special and 58 or 48
		local slot = new("Frame", { LayoutOrder = i, Size = UDim2.fromOffset(sz, sz), BackgroundColor3 = special and Color3.fromRGB(46, 10, 12) or INK, BackgroundTransparency = 0.2, ClipsDescendants = true, Parent = ab }, { K.corner(sz / 2), K.stroke(special and C.red or AMBER, special and 2 or 1.5, special and 0.15 or 0.55) })
		K.label({ Size = UDim2.new(1, 0, 1, -12), Text = a[4], TextSize = special and 26 or 22, TextColor3 = special and C.red or C.text, TextXAlignment = Enum.TextXAlignment.Center, Parent = slot })
		local nameL = K.label({ Name = "AbilityName", Position = UDim2.new(0, 2, 1, -16), Size = UDim2.new(1, -4, 0, 14), Text = a[3], FontFace = FF.bodyB, TextSize = 10, TextColor3 = special and C.text or C.dim, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.AtEnd, Parent = slot })
		if special then H.specialName = nameL end
		K.key(slot, a[2], UDim2.new(0.5, 0, 0, 2), Vector2.new(0.5, 0), ({ Attack = "RT", Special = "Y", Lunge = "RB", Echo = "LB", Scream = "B" })[a[1]])
		local cd = new("Frame", { Name = "CD", AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.fromScale(1, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.35, ZIndex = 3, Parent = slot }, { K.corner(sz / 2) })
		local cdText = K.label({ Size = UDim2.fromScale(1, 1), Text = "", FontFace = FF.num, TextSize = 20, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 4, Parent = slot })
		local lock = K.label({ Size = UDim2.fromScale(1, 1), Text = "🔒", TextSize = 18, TextXAlignment = Enum.TextXAlignment.Center, BackgroundTransparency = 0.25, BackgroundColor3 = Color3.new(0, 0, 0), ZIndex = 5, Visible = false, Parent = slot }, { K.corner(sz / 2) })
		H.abilitySlots[a[1]] = { cd = cd, lock = lock, cdText = cdText }
	end
	function H.setSpecialName(text: string)
		if H.specialName then H.specialName.Text = K.upper(text) end
	end
	function H.setAbility(name: string, locked: boolean, cdFrac: number, secs: number?)
		local s = H.abilitySlots[name]; if not s then return end
		s.lock.Visible = locked
		s.cd.Size = UDim2.fromScale(1, math.clamp(cdFrac, 0, 1))
		s.cdText.Text = (secs and secs > 0.05 and not locked) and string.format(secs >= 10 and "%d" or "%.1f", secs) or ""
	end

	-- ===== dentro do armário: a vista é 3D (frestas reais da porta); aqui só escurece as bordas =====
	local lk = new("Frame", { Name = "LockerView", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 2, Parent = gui })
	edges(lk, Color3.new(0, 0, 0), 0.26)
	K.label({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -26), Size = UDim2.fromOffset(500, 16), Text = "escondido  ·  não faça barulho  ·  [E] sair", FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.faint, TextTransparency = 0.3, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 3, Parent = lk })
	H.lockerView = lk

	-- ===== tela de morte =====
	local death = new("Frame", { Name = "Death", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Visible = false, ZIndex = 40, Parent = gui })
	H.deathTitle = K.label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.45), Size = UDim2.fromOffset(900, 110), Text = "VOCÊ FOI PEGO", FontFace = FF.title, TextSize = 96, TextColor3 = C.red, TextXAlignment = Enum.TextXAlignment.Center, TextTransparency = 1, ZIndex = 41, Parent = death })
	H.deathSub = K.label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.56), Size = UDim2.fromOffset(900, 26), Text = "", FontFace = FF.bodyM, TextSize = 20, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Center, TextTransparency = 1, ZIndex = 41, Parent = death })
	H.death = death

	H.promptLayer = new("Folder", { Name = "Prompts", Parent = gui })
	H.mobileLayer = new("Frame", { Name = "Mobile", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = gui })

	-- ===== modos =====
	function H.setMode(mode: string)
		local round = mode == "survivor" or mode == "monster"
		H.statusFrame.Visible = round
		H.moneyFrame.Visible = mode == "survivor"
		H.cross.Visible = round
		H.clock.Visible = mode ~= "title"
		H.clockSub.Visible = mode ~= "title"
		H.abilityBar.Visible = mode == "monster"
		H.hint.Visible = mode ~= "title"
		fx.Visible = true
		vig.Visible = round -- lobby claro e alegre: sem vinheta
		-- durante a noite a lista de jogadores do Roblox some (libera o canto da bolsa e dá mais imersão)
		pcall(function() game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, not round) end)
	end

	local grainT = 0
	function H.update(dt: number, grainOn: boolean)
		grainT += dt
		if grainT > 0.05 then grainT = 0; H.grain.BackgroundTransparency = grainOn and (0.978 + math.random() * 0.018) or 1 end
	end
	function H.setFear(f: number, t: number)
		fear.Visible = f > 0.2
		if fear.Visible then
			for _, e in ipairs(fear:GetChildren()) do (e :: Frame).BackgroundTransparency = 1 - f * (0.55 + math.sin(t * (4 + f * 6)) * 0.15) end
		end
	end

	return H
end

return Hud
