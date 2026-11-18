-- BLINDER :: menus na tela (painel do lobby + janela da loja)
local RS = game:GetService("ReplicatedStorage")
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local SoundService = game:GetService("SoundService")
local MarketplaceService = game:GetService("MarketplaceService")
local K = require(script.Parent:WaitForChild("UIKit"))
local Settings = require(script.Parent:WaitForChild("Settings"))
local C, FF, new = K.C, K.Font, K.new
local Shared = RS:WaitForChild("Blinder")
local Config = require(Shared:WaitForChild("Config"))
local Remotes = Shared:WaitForChild("Remotes")
local Rigs = require(Shared:WaitForChild("MonsterRigs"))

local Menu = { open = false, current = "Upgrades" }
local player
local hud
local sections = {}
local cursorMode = false
local previews = {}

local NAV = {
	{ id = "Upgrades", title = "MELHORIAS",     sub = "sua corrida",          key = "B", desc = "Corra mais, aguente mais, quebre mais rápido. Comprado com dinheiro guardado e mantido entre as noites." },
	{ id = "Items",    title = "ITENS",         sub = "leve com você",        key = "I", desc = "Equipamentos que vão com você para dentro dos mapas.", badge = "NOVO" },
	{ id = "Skills",   title = "HABILIDADES",   sub = "árvore de talentos",   key = "H", desc = "Ganhe 1 ponto a cada nível. Cada ramo exige a habilidade anterior." },
	{ id = "Monsters", title = "MONSTROS",      sub = "escolha seu pesadelo",  key = "K", desc = "Cada monstro tem sua habilidade única [R]. Os mais caros são os mais fortes.", badge = "NOVO" },
	{ id = "Skins",    title = "SKINS",         sub = "visual de cada monstro", key = "J", desc = "Skins só mudam a aparência. Compre o monstro antes das skins dele." },
	{ id = "Hammers",  title = "MARTELOS",      sub = "skins do seu martelo", key = "U", desc = "Só visual: você e os outros veem o martelo escolhido nas noites.", badge = "NOVO" },
	{ id = "Emotes",   title = "EMOTES",        sub = "danças para a roda",   key = "G", desc = "Use no lobby. A câmera vai para terceira pessoa enquanto você dança." },
	{ id = "Profile",  title = "PERFIL",        sub = "suas estatísticas",    key = "P", desc = "Tudo o que você já fez na mansão." },
	{ id = "Settings", title = "CONFIGURAÇÕES", sub = "som, vídeo e câmera",  key = "O", desc = "Ajustes salvos só neste aparelho durante a sessão." },
}
Menu.NAV = NAV

local function click(pitch: number?)
	local s = Instance.new("Sound"); s.SoundId = Config.Sounds.Click; s.Volume = 0.5 * Settings.sfx; s.PlaybackSpeed = pitch or 1; s.Parent = SoundService; s:Play()
	game:GetService("Debris"):AddItem(s, 2)
end
Menu.click = click
K.onClick = function() click() end

local function notify(text, kind) if hud and hud.notify then hud.notify(text, kind) end end

local function scroller(parent, name)
	return new("ScrollingFrame", { Name = name, Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ScrollBarThickness = 3, ScrollBarImageColor3 = C.faint,
		CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ScrollingDirection = Enum.ScrollingDirection.Y, Visible = false, Parent = parent })
end

local function buyButton(parent, height)
	local b = K.button({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -16), Size = UDim2.new(1, -32, 0, height or 54), Text = "", FontFace = FF.head, TextSize = 18, BackgroundColor3 = C.panel2, Parent = parent })
	return b
end

-- ============ MELHORIAS ============
local UPG_STYLE = {
	Stamina    = { color = C.green,  value = function(l) return tostring(Config.STAMINA_MAX + 12 * l), "fôlego", tostring(Config.STAMINA_MAX + 12 * (l + 1)) end },
	Speed      = { color = C.blue,   value = function(l) return string.format("%.1f", Config.SPRINT_SPEED + 0.6 * l), "velocidade", string.format("%.1f", Config.SPRINT_SPEED + 0.6 * (l + 1)) end },
	Strength   = { color = C.orange, value = function(l) return string.format("%.2f", 1 + 0.25 * l), "x dano", string.format("%.2fx", 1 + 0.25 * (l + 1)) end },
	Resistance = { color = C.red,    value = function(l) return tostring(7 * l), "% menos dor", (7 * (l + 1)) .. "%" end },
	Lungs      = { color = C.teal,   value = function(l) return tostring(l), "nível de fôlego", tostring(l + 1) end },
}
local function buildUpgrades(parent)
	local pg = scroller(parent, "Upgrades")
	new("UIGridLayout", { CellSize = UDim2.new(1 / 3, -11, 0, 330), CellPadding = UDim2.fromOffset(16, 16), SortOrder = Enum.SortOrder.LayoutOrder, Parent = pg })
	new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), Parent = pg })
	local cards = {}
	for i, def in ipairs(Config.Upgrades) do
		local sty = UPG_STYLE[def.id] or { color = C.text, value = function(l) return tostring(l), "", tostring(l + 1) end }
		local card = new("Frame", { LayoutOrder = i, BackgroundColor3 = C.panel, Parent = pg }, { K.corner(4), K.stroke(C.line, 1, 0.93),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(sty.color:Lerp(C.panel, 0.86), C.panel) }) })
		new("Frame", { Size = UDim2.new(1, 0, 0, 3), BackgroundColor3 = sty.color, Parent = card }, { K.corner(2) })
		K.label({ Position = UDim2.fromOffset(20, 18), Size = UDim2.new(1, -40, 0, 26), Text = K.upper(def.display), FontFace = FF.head, TextSize = 21, Parent = card })
		K.label({ Position = UDim2.fromOffset(20, 46), Size = UDim2.new(1, -40, 0, 40), Text = def.desc, FontFace = FF.body, TextSize = 15, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = card })
		local val = K.label({ Position = UDim2.fromOffset(20, 106), Size = UDim2.new(1, -40, 0, 56), Text = "0", FontFace = FF.title, TextSize = 52, Parent = card })
		local unit = K.label({ Position = UDim2.fromOffset(20, 106), Size = UDim2.new(1, -40, 0, 56), Text = "", FontFace = FF.bodyM, TextSize = 15, TextColor3 = C.dim, TextYAlignment = Enum.TextYAlignment.Bottom, Parent = card })
		local nxt = K.label({ Position = UDim2.fromOffset(20, 166), Size = UDim2.new(1, -40, 0, 22), Text = "", FontFace = FF.bodyB, TextSize = 17, TextColor3 = sty.color, Parent = card })
		local lvl = K.label({ Position = UDim2.fromOffset(20, 202), Size = UDim2.new(1, -40, 0, 16), Text = "", FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.dim, Parent = card })
		local pips = new("Frame", { Position = UDim2.fromOffset(20, 222), Size = UDim2.new(1, -40, 0, 4), BackgroundTransparency = 1, Parent = card }, { K.list(Enum.FillDirection.Horizontal, 4) })
		local pipList = {}
		for k = 1, def.max do pipList[k] = new("Frame", { LayoutOrder = k, Size = UDim2.new(1 / def.max, -4, 1, 0), BackgroundColor3 = Color3.fromRGB(60, 60, 66), Parent = pips }, { K.corner(1) }) end
		local btn = buyButton(card)
		btn.MouseButton1Click:Connect(function()
			click()
			local ok, msg = Remotes.BuyUpgrade:InvokeServer(def.id)
			notify(msg or "", ok and "money" or "death")
			if ok then click(1.4); card.BackgroundColor3 = sty.color:Lerp(C.panel, 0.6); K.tween(card, 0.5, { BackgroundColor3 = C.panel }) end
		end)
		cards[def.id] = { def = def, sty = sty, val = val, unit = unit, nxt = nxt, lvl = lvl, pips = pipList, btn = btn }
	end
	local function refresh()
		local money = player:GetAttribute("Money") or 0
		for id, c in pairs(cards) do
			local l = player:GetAttribute("Up_" .. id) or 0
			local v, u, n = c.sty.value(l)
			c.val.Text = v
			c.unit.Position = UDim2.fromOffset(20 + c.val.TextBounds.X + 8, 106)
			c.unit.Text = u
			c.lvl.Text = "NÍVEL " .. l .. " / " .. c.def.max
			for k, p in ipairs(c.pips) do p.BackgroundColor3 = k <= l and c.sty.color or Color3.fromRGB(60, 60, 66) end
			if l >= c.def.max then
				c.nxt.Text = "totalmente melhorado"
				c.btn.Text = "MÁXIMO"; c.btn.TextColor3 = C.dim; c.btn.BackgroundColor3 = C.panel2
			else
				c.nxt.Text = "→  " .. n
				local cost = Config.UpgradeCost(c.def, l)
				if money >= cost then
					c.btn.Text = "COMPRAR  ·  $" .. K.fmt(cost); c.btn.TextColor3 = C.bg; c.btn.BackgroundColor3 = c.sty.color
				else
					c.btn.Text = "$" .. K.fmt(cost) .. "  ·  PRECISA DE $" .. K.fmt(cost - money); c.btn.TextColor3 = C.faint; c.btn.BackgroundColor3 = C.panel2
				end
			end
		end
	end
	return pg, refresh
end

-- ============ ITENS (lanterna) ============
local function meshPreview(parent, assetName, size, dist)
	local vp = new("ViewportFrame", { Size = size, BackgroundTransparency = 1, Ambient = Color3.fromRGB(150, 150, 160), LightColor = Color3.fromRGB(255, 240, 225), LightDirection = Vector3.new(-0.5, -0.6, -1), Parent = parent })
	local cam = Instance.new("Camera"); cam.FieldOfView = 30; cam.Parent = vp; vp.CurrentCamera = cam
	local src = Shared:FindFirstChild("Assets") and Shared.Assets:FindFirstChild(assetName)
	if src then local c = src:Clone(); c.Anchored = true; c.CFrame = CFrame.new(); c.Parent = vp end
	table.insert(previews, { cam = cam, frame = vp, a = math.random() * 6, dist = dist or 6, target = Vector3.zero, section = "Items" })
	return vp
end

local function buildItems(parent)
	local pg = scroller(parent, "Items")
	local FL = Config.Flashlight
	local card = new("Frame", { Size = UDim2.new(1, -8, 0, 300), BackgroundColor3 = C.panel, Parent = pg }, { K.corner(4), K.stroke(C.line, 1, 0.93),
		new("UIGradient", { Rotation = 0, Color = ColorSequence.new(Color3.fromRGB(40, 34, 22), C.panel) }) })
	new("Frame", { Size = UDim2.new(1, 0, 0, 3), BackgroundColor3 = C.gold, Parent = card }, { K.corner(2) })
	local vp = meshPreview(card, "HeadLamp", UDim2.new(0, 300, 1, -20), 4.2)
	vp.Position = UDim2.fromOffset(10, 10)
	K.label({ Position = UDim2.fromOffset(330, 26), Size = UDim2.new(1, -350, 0, 34), Text = K.upper(FL.name), FontFace = FF.title, TextSize = 32, Parent = card })
	K.label({ Position = UDim2.fromOffset(330, 66), Size = UDim2.new(1, -350, 0, 44), Text = FL.desc, FontFace = FF.body, TextSize = 16, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = card })
	local feats = new("Frame", { Position = UDim2.fromOffset(330, 120), Size = UDim2.new(1, -350, 0, 80), BackgroundTransparency = 1, Parent = card }, { K.list(Enum.FillDirection.Vertical, 4) })
	for i, t in ipairs({ "•  Ligue e desligue com [L]", "•  Bateria recarrega sozinha quando desligada", "•  Também aparece escondida nos mapas (vale 1 noite)" }) do
		K.label({ LayoutOrder = i, Size = UDim2.new(1, 0, 0, 20), Text = t, FontFace = FF.bodyM, TextSize = 14, TextColor3 = C.text, Parent = feats })
	end
	local btn = K.button({ AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 330, 1, -22), Size = UDim2.fromOffset(300, 54), Text = "", FontFace = FF.head, TextSize = 18, BackgroundColor3 = C.panel2, Parent = card })
	local shade = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, ZIndex = 5, Visible = false, Parent = card }, { K.corner(4) })
	local soon = K.label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -20, 0, 20), Size = UDim2.fromOffset(160, 28), Text = "🔒  EM BREVE", FontFace = FF.head, TextSize = 18, TextColor3 = C.gold, TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 6, Visible = false, Parent = card })
	btn.MouseButton1Click:Connect(function()
		if player:GetAttribute("OwnsFlashlight") then return end
		if FL.price == nil and FL.gamePassId == nil then notify("A lanterna ainda não está à venda.", "info"); return end
		click()
		local ok, msg = Remotes.BuyFlashlight:InvokeServer()
		if msg and msg ~= "" then notify(msg, ok and "money" or "death") end
	end)
	local function refresh()
		local owns = player:GetAttribute("OwnsFlashlight")
		local available = FL.price ~= nil or FL.gamePassId ~= nil
		shade.Visible = not available and not owns
		soon.Visible = shade.Visible
		if owns then
			btn.Text = "✔  SUA PARA SEMPRE"; btn.BackgroundColor3 = Color3.fromRGB(30, 80, 46); btn.TextColor3 = C.text
		elseif FL.price then
			local money = player:GetAttribute("Money") or 0
			if money >= FL.price then
				btn.Text = "COMPRAR  ·  $" .. K.fmt(FL.price); btn.BackgroundColor3 = C.gold; btn.TextColor3 = C.bg
			else
				btn.Text = "$" .. K.fmt(FL.price) .. "  ·  PRECISA DE $" .. K.fmt(FL.price - money); btn.BackgroundColor3 = C.panel2; btn.TextColor3 = C.faint
			end
		elseif FL.gamePassId then
			btn.Text = "COMPRAR COM ROBUX"; btn.BackgroundColor3 = C.green; btn.TextColor3 = C.bg
		else
			btn.Text = "PREÇO A DEFINIR"; btn.BackgroundColor3 = C.panel2; btn.TextColor3 = C.faint
		end
	end
	return pg, refresh
end

-- ============ HABILIDADES ============
local function buildSkills(parent)
	local pg = new("Frame", { Name = "Skills", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, Parent = parent })
	local tree = "Survivor"
	local bar = new("Frame", { Size = UDim2.new(1, 0, 0, 40), BackgroundTransparency = 1, Parent = pg })
	local bS = K.button({ Size = UDim2.fromOffset(180, 38), Text = "SOBREVIVENTE", FontFace = FF.head, TextSize = 16, Parent = bar })
	local bM = K.button({ Position = UDim2.fromOffset(188, 0), Size = UDim2.fromOffset(180, 38), Text = "MONSTRO", FontFace = FF.head, TextSize = 16, Parent = bar })
	local pts = K.label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -176, 0, 0), Size = UDim2.fromOffset(240, 38), Text = "", FontFace = FF.head, TextSize = 18, TextColor3 = C.gold, TextXAlignment = Enum.TextXAlignment.Right, Parent = bar })
	local reset = K.button({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -8, 0, 0), Size = UDim2.fromOffset(160, 38), Text = "RESETAR  ·  $" .. Config.SKILL_RESET_COST, FontFace = FF.bodyB, TextSize = 13, Parent = bar })
	local area = new("Frame", { Position = UDim2.fromOffset(0, 54), Size = UDim2.new(1, -8, 1, -54), BackgroundTransparency = 1, Parent = pg })
	local nodes = {}
	local function rebuild()
		area:ClearAllChildren()
		table.clear(nodes)
		local accent = tree == "Survivor" and C.blue or C.red
		for b = 1, 3 do
			local col = new("Frame", { Position = UDim2.new((b - 1) / 3, 6, 0, 0), Size = UDim2.new(1 / 3, -12, 1, 0), BackgroundColor3 = C.panel, BackgroundTransparency = 0.2, Parent = area }, { K.corner(4), K.stroke(C.line, 1, 0.94) })
			K.label({ Position = UDim2.fromOffset(16, 12), Size = UDim2.new(1, -32, 0, 24), Text = Config.SkillBranches[tree][b], FontFace = FF.head, TextSize = 20, TextColor3 = accent, Parent = col })
			new("Frame", { Position = UDim2.fromOffset(16, 40), Size = UDim2.fromOffset(36, 2), BackgroundColor3 = accent, Parent = col })
			new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0, 34, 0, 80), Size = UDim2.new(0, 2, 1, -150), BackgroundColor3 = Color3.fromRGB(60, 58, 62), Parent = col })
			for _, s in ipairs(Config.SkillTrees[tree]) do
				if s.branch == b then
					local y = 56 + (s.tier - 1) * 120
					local node = new("TextButton", { AutoButtonColor = false, Text = "", Position = UDim2.new(0, 12, 0, y), Size = UDim2.new(1, -24, 0, 108), BackgroundColor3 = C.panel2, Parent = col }, { K.corner(4) })
					local stroke = K.stroke(C.line, 1, 0.9); stroke.Parent = node
					local dot = new("TextLabel", { Position = UDim2.fromOffset(10, 12), Size = UDim2.fromOffset(26, 26), BackgroundColor3 = Color3.fromRGB(60, 58, 62), Text = tostring(s.tier), FontFace = FF.num, TextSize = 15, TextColor3 = C.text, Parent = node }, { K.corner(13) })
					K.label({ Position = UDim2.fromOffset(46, 10), Size = UDim2.new(1, -56, 0, 20), Text = K.upper(s.name), FontFace = FF.head, TextSize = 16, Parent = node })
					K.label({ Position = UDim2.fromOffset(46, 30), Size = UDim2.new(1, -56, 0, 14), Text = s.cost .. " ponto" .. (s.cost > 1 and "s" or ""), FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.gold, Parent = node })
					K.label({ Position = UDim2.fromOffset(12, 50), Size = UDim2.new(1, -24, 0, 36), Text = s.desc, FontFace = FF.body, TextSize = 13, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = node })
					local state = K.label({ Position = UDim2.new(0, 12, 1, -20), Size = UDim2.new(1, -24, 0, 14), Text = "", FontFace = FF.bodyB, TextSize = 11, Parent = node })
					local confirmUntil = 0
					node.MouseButton1Click:Connect(function()
						if player:GetAttribute("Sk_" .. s.id) then return end
						if os.clock() < confirmUntil then
							confirmUntil = 0
							local ok, msg = Remotes.UnlockSkill:InvokeServer(s.id)
							notify(msg or "", ok and "level" or "death")
							if ok then click(1.5) end
						else
							click(); confirmUntil = os.clock() + 2.5
							state.Text = "CLIQUE DE NOVO PARA CONFIRMAR"; state.TextColor3 = C.gold
							task.delay(2.6, function() if Menu.refreshAll then Menu.refreshAll() end end)
						end
					end)
					nodes[s.id] = { node = node, stroke = stroke, state = state, dot = dot, def = s, accent = accent }
				end
			end
		end
	end
	local function refresh()
		local p = player:GetAttribute("SkillPoints") or 0
		pts.Text = p .. " PONTO" .. (p == 1 and "" or "S") .. " DISPONÍVE" .. (p == 1 and "L" or "IS")
		bS.BackgroundColor3 = tree == "Survivor" and C.hover or C.panel2; bS.TextColor3 = tree == "Survivor" and C.blue or C.dim
		bM.BackgroundColor3 = tree == "Monster" and C.hover or C.panel2; bM.TextColor3 = tree == "Monster" and C.red or C.dim
		for id, n in pairs(nodes) do
			local owned = player:GetAttribute("Sk_" .. id)
			local reqOk = (not n.def.req) or player:GetAttribute("Sk_" .. n.def.req)
			if owned then
				n.state.Text = "✔ ADQUIRIDA"; n.state.TextColor3 = C.green
				n.stroke.Color = C.gold; n.stroke.Transparency = 0.3; n.node.BackgroundColor3 = Color3.fromRGB(38, 33, 22); n.dot.BackgroundColor3 = C.gold; n.dot.TextColor3 = C.bg
			elseif reqOk and p >= n.def.cost then
				n.state.Text = "DISPONÍVEL  ·  clique para desbloquear"; n.state.TextColor3 = C.text
				n.stroke.Color = n.accent; n.stroke.Transparency = 0.2; n.node.BackgroundColor3 = C.panel2; n.dot.BackgroundColor3 = n.accent; n.dot.TextColor3 = C.bg
			elseif not reqOk then
				n.state.Text = "🔒 BLOQUEADA"; n.state.TextColor3 = C.faint
				n.stroke.Color = C.line; n.stroke.Transparency = 0.94; n.node.BackgroundColor3 = Color3.fromRGB(20, 20, 23); n.dot.BackgroundColor3 = Color3.fromRGB(50, 48, 52); n.dot.TextColor3 = C.faint
			else
				n.state.Text = "SEM PONTOS SUFICIENTES"; n.state.TextColor3 = C.faint
				n.stroke.Color = C.line; n.stroke.Transparency = 0.9; n.node.BackgroundColor3 = C.panel2; n.dot.BackgroundColor3 = Color3.fromRGB(60, 58, 62); n.dot.TextColor3 = C.text
			end
		end
	end
	bS.MouseButton1Click:Connect(function() tree = "Survivor"; rebuild(); refresh() end)
	bM.MouseButton1Click:Connect(function() tree = "Monster"; rebuild(); refresh() end)
	reset.MouseButton1Click:Connect(function()
		local ok, msg = Remotes.ResetSkills:InvokeServer(tree)
		notify(msg or "", ok and "money" or "death")
	end)
	rebuild()
	return pg, refresh
end

-- ============ SKINS ============
local function skinModel(id: string): Model?
	local lobby = workspace:FindFirstChild("Lobby")
	local g = lobby and lobby:FindFirstChild("Gallery")
	local src = g and g:FindFirstChild("Display_" .. id)
	if not src then return nil end
	src.Archivable = true
	local m = src:Clone()
	m:PivotTo(CFrame.new(0, 5, 0))
	return m
end

local function buildSkins(parent)
	local pg = scroller(parent, "Skins")
	new("UIGridLayout", { CellSize = UDim2.new(1 / 3, -11, 0, 336), CellPadding = UDim2.fromOffset(16, 16), SortOrder = Enum.SortOrder.LayoutOrder, Parent = pg })
	new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), Parent = pg })
	local cards = {}
	for i, s in ipairs(Config.Skins) do
		local rc = Config.RarityColors[s.rarity] or C.text
		local card = new("Frame", { LayoutOrder = i, BackgroundColor3 = C.panel, Parent = pg }, { K.corner(4) })
		local stroke = K.stroke(C.line, 1, 0.93); stroke.Parent = card
		local art = new("Frame", { Position = UDim2.fromOffset(10, 10), Size = UDim2.new(1, -20, 0, 196), BackgroundColor3 = rc:Lerp(Color3.new(0, 0, 0), 0.82), Parent = card }, { K.corner(3),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(rc:Lerp(Color3.new(0, 0, 0), 0.6), Color3.fromRGB(10, 10, 12)) }) })
		local vp = new("ViewportFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Ambient = Color3.fromRGB(150, 140, 150), LightColor = Color3.fromRGB(255, 235, 220), LightDirection = Vector3.new(-0.4, -0.6, -1), Parent = art })
		local cam = Instance.new("Camera"); cam.FieldOfView = 34; cam.Parent = vp; vp.CurrentCamera = cam
		local wm = Instance.new("WorldModel"); wm.Parent = vp
		local model = skinModel(s.id)
		if model then model.Parent = wm end
		table.insert(previews, { cam = cam, frame = vp, a = i * 0.8, dist = 17, target = Vector3.new(0, 5.6, 0), section = "Skins" })
		new("Frame", { Position = UDim2.fromOffset(10, 206), Size = UDim2.new(1, -20, 0, 2), BackgroundColor3 = rc, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 216), Size = UDim2.new(1, -32, 0, 24), Text = K.upper(s.name), FontFace = FF.head, TextSize = 19, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 240), Size = UDim2.new(1, -32, 0, 14), Text = K.upper(s.rarity), FontFace = FF.bodyB, TextSize = 12, TextColor3 = rc, Parent = card })
		local btn = K.button({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -12), Size = UDim2.new(1, -24, 0, 44), Text = "", FontFace = FF.head, TextSize = 16, Parent = card })
		btn.MouseButton1Click:Connect(function()
			local ok, msg = Remotes.BuySkin:InvokeServer(s.id)
			if msg and msg ~= "" then notify(msg, ok and "money" or "death") end
		end)
		cards[s.id] = { btn = btn, stroke = stroke, def = s, rc = rc }
	end
	local function refresh()
		local money = player:GetAttribute("Money") or 0
		local eq = player:GetAttribute("EquippedSkin") or "Blinder"
		for id, c in pairs(cards) do
			local owned = player:GetAttribute("Skin_" .. id)
			if id == eq then
				c.btn.Text = "✔  EQUIPADA"; c.btn.BackgroundColor3 = Color3.fromRGB(30, 80, 46); c.btn.TextColor3 = C.text; c.stroke.Color = c.rc; c.stroke.Transparency = 0.2
			elseif owned then
				c.btn.Text = "EQUIPAR"; c.btn.BackgroundColor3 = C.hover; c.btn.TextColor3 = C.text; c.stroke.Color = C.line; c.stroke.Transparency = 0.9
			else
				c.stroke.Color = C.line; c.stroke.Transparency = 0.93
				if money >= c.def.price then
					c.btn.Text = "COMPRAR  ·  $" .. K.fmt(c.def.price); c.btn.BackgroundColor3 = c.rc; c.btn.TextColor3 = C.bg
				else
					c.btn.Text = "$" .. K.fmt(c.def.price); c.btn.BackgroundColor3 = C.panel2; c.btn.TextColor3 = C.faint
				end
			end
		end
	end
	return pg, refresh
end

-- ============ MONSTROS (tipos) ============
local function rigPreview(parent, typeId, skinId, section, extra)
	local vp = new("ViewportFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Ambient = Color3.fromRGB(150, 140, 150), LightColor = Color3.fromRGB(255, 235, 220), LightDirection = Vector3.new(-0.4, -0.6, -1), Parent = parent })
	local cam = Instance.new("Camera"); cam.FieldOfView = 32; cam.Parent = vp; vp.CurrentCamera = cam
	local wm = Instance.new("WorldModel"); wm.Parent = vp
	local m = Rigs.Clone(typeId, skinId, true)
	local h = 11
	if m then
		local _, size = m:GetBoundingBox()
		h = size.Y
		m:PivotTo(CFrame.new(0, m.Humanoid.HipHeight + m.PrimaryPart.Size.Y / 2, 0))
		m.Parent = wm
	end
	local entry = { cam = cam, frame = vp, a = math.random() * 6, dist = h * 1.85, target = Vector3.new(0, h * 0.52, 0), section = section, extra = extra }
	table.insert(previews, entry)
	return vp, entry
end

local function statBar(parent, y, label, frac, color)
	K.label({ Position = UDim2.fromOffset(16, y), Size = UDim2.fromOffset(110, 14), Text = label, FontFace = FF.bodyB, TextSize = 11, TextColor3 = C.dim, Parent = parent })
	local back = new("Frame", { Position = UDim2.new(0, 120, 0, y + 4), Size = UDim2.new(1, -136, 0, 5), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.88, Parent = parent }, { K.corner(2) })
	new("Frame", { Size = UDim2.fromScale(math.clamp(frac, 0.06, 1), 1), BackgroundColor3 = color, Parent = back }, { K.corner(2) })
end

local function buildMonsters(parent)
	local pg = scroller(parent, "Monsters")
	new("UIGridLayout", { CellSize = UDim2.new(1 / 3, -11, 0, 470), CellPadding = UDim2.fromOffset(16, 16), SortOrder = Enum.SortOrder.LayoutOrder, Parent = pg })
	new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), Parent = pg })
	local cards = {}
	for i, def in ipairs(Config.Monsters) do
		local rc = Config.RarityColors[def.tier] or C.text
		local card = new("Frame", { LayoutOrder = i, BackgroundColor3 = C.panel, Parent = pg }, { K.corner(4) })
		local stroke = K.stroke(C.line, 1, 0.93); stroke.Parent = card
		local art = new("Frame", { Position = UDim2.fromOffset(10, 10), Size = UDim2.new(1, -20, 0, 210), BackgroundColor3 = rc:Lerp(Color3.new(0, 0, 0), 0.85), Parent = card }, { K.corner(3),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(rc:Lerp(Color3.new(0, 0, 0), 0.62), Color3.fromRGB(10, 10, 12)) }) })
		rigPreview(art, def.id, "Original", "Monsters")
		new("Frame", { Position = UDim2.fromOffset(10, 220), Size = UDim2.new(1, -20, 0, 2), BackgroundColor3 = rc, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 230), Size = UDim2.new(1, -32, 0, 26), Text = K.upper(def.name), FontFace = FF.title, TextSize = 22, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 256), Size = UDim2.new(1, -32, 0, 14), Text = K.upper(def.tier), FontFace = FF.bodyB, TextSize = 12, TextColor3 = rc, Parent = card })
		local s = def.stats
		statBar(card, 280, "VELOCIDADE", (s.chase - 20) / 5, C.blue)
		statBar(card, 298, "ALCANCE", (s.kill - 5.5) / 2.2, C.red)
		statBar(card, 316, "AUDIÇÃO", (s.hear - 1.1) / 0.8, C.purple)
		K.label({ Position = UDim2.fromOffset(16, 340), Size = UDim2.new(1, -32, 0, 18), Text = "★  [R]  " .. K.upper(def.ability.name), FontFace = FF.head, TextSize = 15, TextColor3 = C.gold, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 360), Size = UDim2.new(1, -32, 0, 44), Text = def.ability.desc, FontFace = FF.body, TextSize = 13, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = card })
		local btn = K.button({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -12), Size = UDim2.new(1, -24, 0, 46), Text = "", FontFace = FF.head, TextSize = 16, Parent = card })
		btn.MouseButton1Click:Connect(function()
			local ok, msg = Remotes.BuyMonster:InvokeServer(def.id)
			if msg and msg ~= "" then notify(msg, ok and "money" or "death") end
			if ok then click(1.4) end
		end)
		cards[def.id] = { btn = btn, stroke = stroke, def = def, rc = rc }
	end
	local function refresh()
		local money = player:GetAttribute("Money") or 0
		local eq = player:GetAttribute("EquippedMonster") or "Blinder"
		for id, c in pairs(cards) do
			local owned = player:GetAttribute("Mon_" .. id)
			if id == eq then
				c.btn.Text = "✔  EQUIPADO"; c.btn.BackgroundColor3 = Color3.fromRGB(30, 80, 46); c.btn.TextColor3 = C.text; c.stroke.Color = c.rc; c.stroke.Transparency = 0.2
			elseif owned then
				c.btn.Text = "EQUIPAR"; c.btn.BackgroundColor3 = C.hover; c.btn.TextColor3 = C.text; c.stroke.Color = C.line; c.stroke.Transparency = 0.9
			else
				c.stroke.Color = C.line; c.stroke.Transparency = 0.93
				if money >= c.def.price then
					c.btn.Text = "COMPRAR  ·  $" .. K.fmt(c.def.price); c.btn.BackgroundColor3 = c.rc; c.btn.TextColor3 = C.bg
				else
					c.btn.Text = "$" .. K.fmt(c.def.price) .. "  ·  PRECISA DE $" .. K.fmt(c.def.price - money); c.btn.BackgroundColor3 = C.panel2; c.btn.TextColor3 = C.faint
				end
			end
		end
	end
	return pg, refresh
end

-- ============ AVATAR DO JOGADOR nas prévias ============
-- clona o personagem de quem está vendo e anima dentro do ViewportFrame
local function avatarClone(keepHammer: boolean?): Model?
	local c = player and player.Character
	if not c or not c:FindFirstChild("HumanoidRootPart") then return nil end
	local was = c.Archivable
	c.Archivable = true
	local ok, m = pcall(function() return c:Clone() end)
	c.Archivable = was
	if not ok or not m then return nil end
	for _, d in ipairs(m:GetDescendants()) do
		if d:IsA("BaseScript") or d:IsA("Sound") or d:IsA("ProximityPrompt") or d:IsA("BillboardGui") or d:IsA("Light") or d:IsA("ParticleEmitter") or d:IsA("ForceField") then d:Destroy()
		elseif d:IsA("BasePart") then d.CanCollide = false; d.CanQuery = false; d.CanTouch = false; d.Anchored = false; d.LocalTransparencyModifier = 0 end
	end
	for _, n in ipairs({ "HeadLampModel", keepHammer and "" or "HammerModel" }) do local x = m:FindFirstChild(n); if x then x:Destroy() end end
	local hrp = m:FindFirstChild("HumanoidRootPart") :: BasePart
	hrp.Anchored = true
	m:PivotTo(CFrame.new(0, 0, 0))
	local hum = m:FindFirstChildOfClass("Humanoid")
	if hum then hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None; hum.PlatformStand = true end
	return m
end

local function avatarViewport(parent, opts)
	local vp = new("ViewportFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Ambient = Color3.fromRGB(120, 105, 115), LightColor = Color3.fromRGB(255, 200, 180), LightDirection = Vector3.new(-0.6, -0.5, 0.8), Parent = parent })
	local cam = Instance.new("Camera"); cam.FieldOfView = 32; cam.Parent = vp; vp.CurrentCamera = cam
	cam.CFrame = CFrame.lookAt(Vector3.new(0, 0.6, -11), Vector3.new(0, 0, 0))
	local wm = Instance.new("WorldModel"); wm.Parent = vp
	local loading = K.label({ Size = UDim2.fromScale(1, 1), Text = "...", FontFace = FF.bodyB, TextSize = 16, TextColor3 = C.faint, TextXAlignment = Enum.TextXAlignment.Center, Parent = parent })
	local current
	local function build()
		if current then current:Destroy(); current = nil end
		local m = avatarClone(false)
		if not m then return end
		m.Parent = wm
		current = m
		loading.Visible = false
		if opts.hammer then
			local A = Shared.Assets
			local f = A:FindFirstChild("HammerSkins")
			local src = (opts.hammer ~= "Default" and f and f:FindFirstChild(opts.hammer)) or A:FindFirstChild("Hammer")
			local hand = m:FindFirstChild("RightHand") or m:FindFirstChild("Right Arm")
			if src and hand then
				local h = src:Clone(); h.Anchored = false; h.CanCollide = false; h.Massless = true
				h.Size = h.Size * 0.78
				h.CFrame = hand.CFrame * CFrame.new(0, -0.35, -0.2) * CFrame.Angles(math.rad(-90), 0, 0) * CFrame.new(0, 0.7, 0) * CFrame.Angles(0, math.rad(143 + (src:GetAttribute("RotY") or 0)), 0)
				local w = Instance.new("WeldConstraint"); w.Part0 = hand; w.Part1 = h; w.Parent = h
				h.Parent = m
			end
		end
		local hum = m:FindFirstChildOfClass("Humanoid")
		if hum and opts.anim then
			local animator = hum:FindFirstChildOfClass("Animator") or Instance.new("Animator", hum)
			local a = Instance.new("Animation"); a.AnimationId = opts.anim
			local ok, track = pcall(function() return animator:LoadAnimation(a) end)
			if ok and track then track.Looped = true; track:Play(0.1, 1, opts.speed or 1) end
		end
	end
	task.spawn(function()
		if not player.Character then player.CharacterAdded:Wait() end
		task.wait(1.5)
		pcall(build)
		player.CharacterAppearanceLoaded:Connect(function() task.wait(0.5); pcall(build) end)
	end)
	table.insert(previews, { cam = cam, frame = vp, a = math.random() * 6, dist = 11, target = Vector3.new(0, 0, 0), section = opts.section, avatar = true })
	return vp
end

-- ============ MARTELOS (skins) ============
local function hammerPreview(parent, skinId)
	local vp = new("ViewportFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Ambient = Color3.fromRGB(160, 150, 160), LightColor = Color3.fromRGB(255, 240, 225), LightDirection = Vector3.new(-0.5, -0.7, -1), Parent = parent })
	local cam = Instance.new("Camera"); cam.FieldOfView = 30; cam.Parent = vp; vp.CurrentCamera = cam
	local A = Shared.Assets
	local f = A:FindFirstChild("HammerSkins")
	local src = (skinId ~= "Default" and f and f:FindFirstChild(skinId)) or A:FindFirstChild("Hammer")
	if src then
		local h = src:Clone(); h.Anchored = true
		h.CFrame = CFrame.Angles(0, math.rad(src:GetAttribute("RotY") or 0), math.rad(-18))
		h.Parent = vp
	end
	local entry = { cam = cam, frame = vp, a = math.random() * 6, dist = 6.4, target = Vector3.new(0, 0.1, 0), section = "Hammers" }
	table.insert(previews, entry)
	return vp
end

local function buildHammers(parent)
	local pg = scroller(parent, "Hammers")
	new("UIGridLayout", { CellSize = UDim2.new(1 / 3, -11, 0, 360), CellPadding = UDim2.fromOffset(16, 16), SortOrder = Enum.SortOrder.LayoutOrder, Parent = pg })
	new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), Parent = pg })
	local cards = {}
	for i, def in ipairs(Config.HammerSkins) do
		local rc = Config.RarityColors[def.rarity] or C.text
		local card = new("Frame", { LayoutOrder = i, BackgroundColor3 = C.panel, Parent = pg }, { K.corner(14) })
		local stroke = K.stroke(C.line, 1, 0.93); stroke.Parent = card
		local art = new("Frame", { Position = UDim2.fromOffset(10, 10), Size = UDim2.new(1, -20, 0, 190), BackgroundColor3 = rc:Lerp(Color3.new(0, 0, 0), 0.8), Parent = card }, { K.corner(12),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(rc:Lerp(Color3.new(0, 0, 0), 0.55), Color3.fromRGB(12, 14, 22)) }) })
		hammerPreview(art, def.id)
		-- e o SEU avatar segurando o martelo
		local av = new("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.fromScale(0.55, 1), BackgroundTransparency = 1, Parent = art })
		avatarViewport(av, { hammer = def.id, anim = "rbxassetid://507770677", speed = 0.6, section = "Hammers" })
		K.label({ Position = UDim2.fromOffset(16, 208), Size = UDim2.new(1, -32, 0, 26), Text = K.upper(def.name), FontFace = FF.title, TextSize = 21, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 234), Size = UDim2.new(1, -32, 0, 14), Text = K.upper(def.rarity), FontFace = FF.bodyB, TextSize = 12, TextColor3 = rc, Parent = card })
		K.label({ Position = UDim2.fromOffset(16, 252), Size = UDim2.new(1, -32, 0, 40), Text = def.desc, FontFace = FF.body, TextSize = 13, TextColor3 = C.dim, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, Parent = card })
		local btn = K.button({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -12), Size = UDim2.new(1, -24, 0, 46), Text = "", FontFace = FF.head, TextSize = 16, Parent = card })
		btn.MouseButton1Click:Connect(function()
			local ok, msg = Remotes.BuyHammer:InvokeServer(def.id)
			if msg and msg ~= "" then notify(msg, ok and "money" or "death") end
			if ok then click(1.4) end
		end)
		cards[def.id] = { btn = btn, stroke = stroke, def = def, rc = rc }
	end
	local function refresh()
		local money = player:GetAttribute("Money") or 0
		local eq = player:GetAttribute("HammerSkin") or "Default"
		for id, c in pairs(cards) do
			local owned = id == "Default" or player:GetAttribute("Ham_" .. id)
			if id == eq then
				c.btn.Text = "✔  EQUIPADO"; c.btn.BackgroundColor3 = Color3.fromRGB(30, 80, 46); c.btn.TextColor3 = C.text; c.stroke.Color = c.rc; c.stroke.Transparency = 0.2
			elseif owned then
				c.btn.Text = "EQUIPAR"; c.btn.BackgroundColor3 = C.hover; c.btn.TextColor3 = C.text; c.stroke.Color = C.line; c.stroke.Transparency = 0.9
			else
				c.stroke.Color = C.line; c.stroke.Transparency = 0.93
				if money >= c.def.price then
					c.btn.Text = "COMPRAR  ·  $" .. K.fmt(c.def.price); c.btn.BackgroundColor3 = c.rc; c.btn.TextColor3 = C.bg
				else
					c.btn.Text = "$" .. K.fmt(c.def.price) .. "  ·  PRECISA DE $" .. K.fmt(c.def.price - money); c.btn.BackgroundColor3 = C.panel2; c.btn.TextColor3 = C.faint
				end
			end
		end
	end
	return pg, refresh
end

-- ============ SKINS por monstro ============
local function buildSkins2(parent)
	local pg = new("Frame", { Name = "Skins", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, Parent = parent })
	local tabs = new("Frame", { Size = UDim2.new(1, 0, 0, 38), BackgroundTransparency = 1, Parent = pg }, { K.list(Enum.FillDirection.Horizontal, 6) })
	local grid = new("ScrollingFrame", { Position = UDim2.fromOffset(0, 50), Size = UDim2.new(1, 0, 1, -50), BackgroundTransparency = 1, ScrollBarThickness = 3, ScrollBarImageColor3 = C.faint,
		CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ScrollingDirection = Enum.ScrollingDirection.Y, Parent = pg })
	local selected = "Blinder"
	local tabBtns, cards = {}, {}
	local function rebuild()
		for i = #previews, 1, -1 do if previews[i].section == "Skins" then table.remove(previews, i) end end
		grid:ClearAllChildren()
		table.clear(cards)
		new("UIGridLayout", { CellSize = UDim2.new(1 / 3, -11, 0, 330), CellPadding = UDim2.fromOffset(16, 16), SortOrder = Enum.SortOrder.LayoutOrder, Parent = grid })
		new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), Parent = grid })
		local mon = Config.GetMonster(selected)
		for i, sk in ipairs(Config.MonsterSkins) do
			local rc = Config.RarityColors[sk.rarity] or C.text
			local card = new("Frame", { LayoutOrder = i, BackgroundColor3 = C.panel, Parent = grid }, { K.corner(4) })
			local stroke = K.stroke(C.line, 1, 0.93); stroke.Parent = card
			local art = new("Frame", { Position = UDim2.fromOffset(10, 10), Size = UDim2.new(1, -20, 0, 200), BackgroundColor3 = rc:Lerp(Color3.new(0, 0, 0), 0.85), Parent = card }, { K.corner(3),
				new("UIGradient", { Rotation = 90, Color = ColorSequence.new(rc:Lerp(Color3.new(0, 0, 0), 0.62), Color3.fromRGB(10, 10, 12)) }) })
			rigPreview(art, selected, sk.id, "Skins")
			new("Frame", { Position = UDim2.fromOffset(10, 210), Size = UDim2.new(1, -20, 0, 2), BackgroundColor3 = rc, Parent = card })
			K.label({ Position = UDim2.fromOffset(16, 220), Size = UDim2.new(1, -32, 0, 24), Text = K.upper(sk.name), FontFace = FF.head, TextSize = 19, Parent = card })
			K.label({ Position = UDim2.fromOffset(16, 244), Size = UDim2.new(1, -32, 0, 14), Text = K.upper(mon.name) .. "  ·  " .. K.upper(sk.rarity), FontFace = FF.bodyB, TextSize = 12, TextColor3 = rc, Parent = card })
			local btn = K.button({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -12), Size = UDim2.new(1, -24, 0, 44), Text = "", FontFace = FF.head, TextSize = 16, Parent = card })
			btn.MouseButton1Click:Connect(function()
				local ok, msg = Remotes.BuyMonsterSkin:InvokeServer(selected, sk.id)
				if msg and msg ~= "" then notify(msg, ok and "money" or "death") end
			end)
			cards[sk.id] = { btn = btn, stroke = stroke, def = sk, rc = rc, price = Config.SkinPrice(mon, sk) }
		end
	end
	local function refresh()
		local money = player:GetAttribute("Money") or 0
		local ownsMon = player:GetAttribute("Mon_" .. selected)
		local eq = player:GetAttribute("MSkinEq_" .. selected) or "Original"
		for id, b in pairs(tabBtns) do
			b.BackgroundColor3 = id == selected and C.hover or C.panel2
			b.TextColor3 = id == selected and C.text or (player:GetAttribute("Mon_" .. id) and C.dim or C.faint)
		end
		for id, c in pairs(cards) do
			local owned = player:GetAttribute("MSkin_" .. selected .. "_" .. id)
			if not ownsMon then
				c.btn.Text = "🔒  COMPRE O MONSTRO"; c.btn.BackgroundColor3 = C.panel2; c.btn.TextColor3 = C.faint; c.stroke.Transparency = 0.93
			elseif id == eq then
				c.btn.Text = "✔  EQUIPADA"; c.btn.BackgroundColor3 = Color3.fromRGB(30, 80, 46); c.btn.TextColor3 = C.text; c.stroke.Color = c.rc; c.stroke.Transparency = 0.2
			elseif owned then
				c.btn.Text = "EQUIPAR"; c.btn.BackgroundColor3 = C.hover; c.btn.TextColor3 = C.text; c.stroke.Color = C.line; c.stroke.Transparency = 0.9
			elseif money >= c.price then
				c.btn.Text = "COMPRAR  ·  $" .. K.fmt(c.price); c.btn.BackgroundColor3 = c.rc; c.btn.TextColor3 = C.bg; c.stroke.Transparency = 0.93
			else
				c.btn.Text = "$" .. K.fmt(c.price); c.btn.BackgroundColor3 = C.panel2; c.btn.TextColor3 = C.faint; c.stroke.Transparency = 0.93
			end
		end
	end
	for i, def in ipairs(Config.Monsters) do
		local b = K.button({ LayoutOrder = i, Size = UDim2.fromOffset(128, 36), Text = K.upper(def.name), FontFace = FF.head, TextSize = 13, Parent = tabs })
		b.MouseButton1Click:Connect(function() selected = def.id; rebuild(); refresh() end)
		tabBtns[def.id] = b
	end
	rebuild()
	return pg, refresh
end

-- ============ EMOTES ============
local function buildEmotes(parent)
	local pg = scroller(parent, "Emotes")
	new("UIGridLayout", { CellSize = UDim2.new(0.25, -12, 0, 250), CellPadding = UDim2.fromOffset(16, 16), SortOrder = Enum.SortOrder.LayoutOrder, Parent = pg })
	new("UIPadding", { PaddingRight = UDim.new(0, 8), Parent = pg })
	local icons = { Wave = "👋", Point = "👉", Cheer = "🙌", Laugh = "😂", Dance1 = "🕺", Dance2 = "💃", Dance3 = "🤸" }
	local cards = {}
	for i, e in ipairs(Config.Emotes) do
		local card = new("TextButton", { LayoutOrder = i, AutoButtonColor = false, Text = "", BackgroundColor3 = C.panel, Parent = pg }, { K.corner(4) })
		local stroke = K.stroke(C.line, 1, 0.93); stroke.Parent = card
		local stage = new("Frame", { Position = UDim2.fromOffset(8, 8), Size = UDim2.new(1, -16, 0, 170), BackgroundColor3 = Color3.fromRGB(18, 10, 14), Parent = card }, { K.corner(4),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromRGB(60, 14, 22), Color3.fromRGB(10, 8, 12)) }) })
		avatarViewport(stage, { anim = e.anim, section = "Emotes" })
		K.label({ Position = UDim2.fromOffset(0, 186), Size = UDim2.new(1, 0, 0, 22), Text = K.upper(e.name), FontFace = FF.head, TextSize = 17, TextXAlignment = Enum.TextXAlignment.Center, Parent = card })
		local price = K.label({ Position = UDim2.fromOffset(0, 214), Size = UDim2.new(1, 0, 0, 22), Text = "", FontFace = FF.bodyB, TextSize = 14, TextXAlignment = Enum.TextXAlignment.Center, Parent = card })
		card.MouseEnter:Connect(function() K.tween(card, 0.12, { BackgroundColor3 = C.panel2 }) end)
		card.MouseLeave:Connect(function() K.tween(card, 0.2, { BackgroundColor3 = C.panel }) end)
		card.MouseButton1Click:Connect(function()
			click()
			if player:GetAttribute("Emote_" .. e.id) then
				if Menu.playEmote then Menu.playEmote(e.id) end
				Menu.toggle(false)
			else
				local ok, msg = Remotes.BuyEmote:InvokeServer(e.id)
				if msg and msg ~= "" then notify(msg, ok and "money" or "death") end
			end
		end)
		cards[e.id] = { price = price, stroke = stroke, def = e }
	end
	local function refresh()
		local money = player:GetAttribute("Money") or 0
		for id, c in pairs(cards) do
			if player:GetAttribute("Emote_" .. id) then
				c.price.Text = "▶  USAR"; c.price.TextColor3 = C.green; c.stroke.Color = C.green; c.stroke.Transparency = 0.6
			else
				c.price.Text = "$" .. K.fmt(c.def.price); c.price.TextColor3 = money >= c.def.price and C.gold or C.faint
				c.stroke.Color = C.line; c.stroke.Transparency = 0.93
			end
		end
	end
	return pg, refresh
end

-- ============ PERFIL ============
local function buildProfile(parent)
	local pg = scroller(parent, "Profile")
	local head = new("Frame", { Size = UDim2.new(1, -8, 0, 124), BackgroundColor3 = C.panel, Parent = pg }, { K.corner(4), K.stroke(C.line, 1, 0.93) })
	local avatar = new("ImageLabel", { Position = UDim2.fromOffset(18, 18), Size = UDim2.fromOffset(88, 88), BackgroundColor3 = C.panel2, Parent = head }, { K.corner(44) })
	task.spawn(function()
		local ok, img = pcall(function() return game:GetService("Players"):GetUserThumbnailAsync(player.UserId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size150x150) end)
		if ok then avatar.Image = img end
	end)
	K.label({ Position = UDim2.fromOffset(124, 20), Size = UDim2.new(1, -140, 0, 34), Text = player.DisplayName, FontFace = FF.title, TextSize = 30, Parent = head })
	local lvl = K.label({ Position = UDim2.fromOffset(124, 56), Size = UDim2.new(1, -140, 0, 18), Text = "", FontFace = FF.bodyB, TextSize = 14, TextColor3 = C.gold, Parent = head })
	local _, setXP = K.bar(head, UDim2.fromOffset(124, 82), UDim2.new(1, -150, 0, 5), C.purple, "XPBar")
	local xpL = K.label({ Position = UDim2.fromOffset(124, 92), Size = UDim2.new(1, -150, 0, 16), Text = "", FontFace = FF.body, TextSize = 13, TextColor3 = C.dim, Parent = head })
	local grid = new("Frame", { Position = UDim2.fromOffset(0, 140), Size = UDim2.new(1, -8, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = pg })
	new("UIGridLayout", { CellSize = UDim2.new(0.25, -12, 0, 96), CellPadding = UDim2.fromOffset(16, 16), Parent = grid })
	local stats = {}
	for _, s in ipairs({ { "Money", "DINHEIRO", "$" }, { "Escapes", "FUGAS", "" }, { "Deaths", "MORTES", "" }, { "Kills", "VÍTIMAS (MONSTRO)", "" }, { "Broken", "OBJETOS QUEBRADOS", "" }, { "Rounds", "NOITES JOGADAS", "" }, { "SkillPoints", "PONTOS DE HABILIDADE", "" }, { "Level", "NÍVEL", "" } }) do
		local c = new("Frame", { BackgroundColor3 = C.panel, Parent = grid }, { K.corner(4), K.stroke(C.line, 1, 0.93) })
		K.label({ Position = UDim2.fromOffset(16, 14), Size = UDim2.new(1, -32, 0, 14), Text = s[2], FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.dim, Parent = c })
		stats[s[1]] = { l = K.label({ Position = UDim2.fromOffset(16, 36), Size = UDim2.new(1, -32, 0, 44), Text = "0", FontFace = FF.title, TextSize = 36, Parent = c }), prefix = s[3] }
	end
	local function refresh()
		local L = player:GetAttribute("Level") or 1
		local xp, need = player:GetAttribute("XP") or 0, player:GetAttribute("XPNeed") or 100
		lvl.Text = "NÍVEL " .. L
		setXP(xp / need)
		xpL.Text = xp .. " / " .. need .. " XP  ·  faltam " .. (need - xp) .. " para o nível " .. (L + 1)
		for k, s in pairs(stats) do s.l.Text = s.prefix .. K.fmt(player:GetAttribute(k) or 0) end
	end
	return pg, refresh
end

-- ============ CONFIGURAÇÕES ============
local function slider(parent, order, label, min, max, key, fmt)
	local row = new("Frame", { LayoutOrder = order, Size = UDim2.new(1, -8, 0, 64), BackgroundColor3 = C.panel, Parent = parent }, { K.corner(4), K.stroke(C.line, 1, 0.94) })
	K.label({ Position = UDim2.fromOffset(20, 0), Size = UDim2.fromOffset(260, 64), Text = label, FontFace = FF.head, TextSize = 17, Parent = row })
	local valL = K.label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -20, 0, 0), Size = UDim2.fromOffset(70, 64), Text = "", FontFace = FF.num, TextSize = 18, TextXAlignment = Enum.TextXAlignment.Right, Parent = row })
	local track = new("TextButton", { AutoButtonColor = false, Text = "", AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -100, 0.5, 0), Size = UDim2.new(0.5, 0, 0, 6), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.88, Parent = row }, { K.corner(3) })
	local fill = new("Frame", { Size = UDim2.fromScale(0.5, 1), BackgroundColor3 = C.red, Parent = track }, { K.corner(3) })
	local knob = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(16, 16), BackgroundColor3 = C.text, Parent = track }, { K.corner(8) })
	local function show(v)
		local a = (v - min) / (max - min)
		fill.Size = UDim2.fromScale(a, 1); knob.Position = UDim2.fromScale(a, 0.5)
		valL.Text = fmt(v)
	end
	local dragging = false
	local function setFromX(x)
		local a = math.clamp((x - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
		local v = min + (max - min) * a
		if max - min > 5 then v = math.floor(v + 0.5) end
		Settings.set(key, v); show(v)
	end
	track.InputBegan:Connect(function(i)
		if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = true; setFromX(i.Position.X) end
	end)
	UIS.InputChanged:Connect(function(i)
		if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then setFromX(i.Position.X) end
	end)
	UIS.InputEnded:Connect(function(i)
		if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = false end
	end)
	show(Settings[key])
end

local function toggle(parent, order, label, key)
	local row = new("Frame", { LayoutOrder = order, Size = UDim2.new(1, -8, 0, 64), BackgroundColor3 = C.panel, Parent = parent }, { K.corner(4), K.stroke(C.line, 1, 0.94) })
	K.label({ Position = UDim2.fromOffset(20, 0), Size = UDim2.fromOffset(300, 64), Text = label, FontFace = FF.head, TextSize = 17, Parent = row })
	local sw = new("TextButton", { AutoButtonColor = false, Text = "", AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -20, 0.5, 0), Size = UDim2.fromOffset(52, 26), BackgroundColor3 = C.panel2, Parent = row }, { K.corner(13) })
	local dot = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 3, 0.5, 0), Size = UDim2.fromOffset(20, 20), BackgroundColor3 = C.text, Parent = sw }, { K.corner(10) })
	local function show()
		local on = Settings[key]
		K.tween(sw, 0.15, { BackgroundColor3 = on and C.red or C.panel2 })
		K.tween(dot, 0.15, { Position = on and UDim2.new(1, -23, 0.5, 0) or UDim2.new(0, 3, 0.5, 0) })
	end
	sw.MouseButton1Click:Connect(function() click(); Settings.set(key, not Settings[key]); show() end)
	show()
end

local function buildSettings(parent)
	local pg = scroller(parent, "Settings")
	K.list(Enum.FillDirection.Vertical, 10).Parent = pg
	slider(pg, 1, "VOLUME DA MÚSICA", 0, 1, "music", function(v) return math.floor(v * 100) .. "%" end)
	slider(pg, 2, "VOLUME DOS EFEITOS", 0, 1, "sfx", function(v) return math.floor(v * 100) .. "%" end)
	slider(pg, 3, "CAMPO DE VISÃO", 60, 95, "fov", function(v) return tostring(math.floor(v)) end)
	slider(pg, 4, "TREMOR DA CÂMERA", 0, 1, "shake", function(v) return math.floor(v * 100) .. "%" end)
	toggle(pg, 5, "BALANÇO DA CÂMERA AO ANDAR", "bob")
	toggle(pg, 6, "GRANULADO DE FILME", "grain")
	return pg, function() end
end

-- ===================== montagem =====================
function Menu.init(plr: Player, h, parentOverride: Instance?)
	player, hud = plr, h
	local gui = hud.gui

	-- ===== interface do lobby: cartão do jogador (topo, direita) + doca de ícones redondos (baixo, centro) =====
	local side = new("Frame", { Name = "LobbyPanel", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = gui })
	-- topo-centro: não briga com os botões do Roblox nem com a lista de jogadores
	local card = new("Frame", { Name = "PlayerCard", AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -16, 0, 12), Size = UDim2.fromOffset(300, 92), BackgroundColor3 = C.bg, BackgroundTransparency = 0.35, Parent = side }, { K.corner(46), K.stroke(C.gold, 1.5, 0.55) })
	-- nível: medalha redonda à esquerda do cartão
	local lvBox = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Size = UDim2.fromOffset(76, 76), BackgroundColor3 = C.gold, Parent = card }, { K.corner(38) })
	new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(64, 64), BackgroundColor3 = C.bg, Parent = lvBox }, { K.corner(32) })
	K.label({ Position = UDim2.fromOffset(0, 14), Size = UDim2.new(1, 0, 0, 12), Text = "NÍVEL", FontFace = FF.bodyB, TextSize = 10, TextColor3 = C.gold, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 2, Parent = lvBox })
	local lvNum = K.label({ Position = UDim2.fromOffset(0, 24), Size = UDim2.new(1, 0, 0, 34), Text = "1", FontFace = FF.title, TextSize = 30, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 2, Parent = lvBox })
	local bal = K.label({ Position = UDim2.fromOffset(96, 10), Size = UDim2.fromOffset(186, 34), Text = "$0", FontFace = FF.title, TextSize = 30, TextColor3 = C.gold, Parent = card })
	local xpNum = K.label({ Position = UDim2.fromOffset(96, 44), Size = UDim2.fromOffset(180, 14), Text = "", FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.dim, Parent = card })
	local _, setXP = K.bar(card, UDim2.fromOffset(96, 62), UDim2.fromOffset(176, 6), C.purple, "XP")
	local xpLeft = K.label({ Position = UDim2.fromOffset(96, 70), Size = UDim2.fromOffset(180, 14), Text = "", FontFace = FF.body, TextSize = 11, TextColor3 = C.faint, Parent = card })
	new("UIScale", { Scale = 0.78, Parent = card })
	local dock = new("Frame", { Name = "Dock", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -14), Size = UDim2.fromOffset(9 * 74, 96), BackgroundTransparency = 1, Parent = side }, { K.list(Enum.FillDirection.Horizontal, 10, Enum.HorizontalAlignment.Center) })
	new("UIScale", { Scale = 0.72, Parent = dock })
	local ENTRIES = {
		{ id = "Skills", label = "TALENTOS", icon = "🌳", color = C.purple, key = "H" },
		{ id = "Upgrades", label = "LOJA", icon = "🛒", color = C.gold, key = "B" },
		{ id = "Items", label = "ITENS", icon = "🎒", color = C.teal, key = "I" },
		{ id = "Monsters", label = "MONSTROS", icon = "👹", color = C.red, key = "K" },
		{ id = "Skins", label = "SKINS", icon = "🎨", color = C.orange, key = "J" },
		{ id = "Hammers", label = "MARTELOS", icon = "🔨", color = C.gold, key = "U" },
		{ id = "Emotes", label = "EMOTES", icon = "💃", color = C.blue, key = "G" },
		{ id = "Profile", label = "PERFIL", icon = "👤", color = C.text, key = "P" },
		{ id = "Spectate", label = "ASSISTIR", icon = "👁", color = C.orange, key = "V" },
	}
	local badge
	for i, e in ipairs(ENTRIES) do
		local holder = new("Frame", { LayoutOrder = i, Size = UDim2.fromOffset(64, 96), BackgroundTransparency = 1, Parent = dock })
		local b = new("TextButton", { Name = "Dock_" .. e.id, AutoButtonColor = false, Text = "", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 10), Size = UDim2.fromOffset(60, 60), BackgroundColor3 = C.bg, BackgroundTransparency = 0.2, Parent = holder }, { K.corner(30) })
		local st = K.stroke(e.color, 2, 0.45); st.Parent = b
		local ic = K.label({ Size = UDim2.fromScale(1, 1), Text = e.icon, TextSize = 26, TextXAlignment = Enum.TextXAlignment.Center, Parent = b })
		local lab = K.label({ AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 74), Size = UDim2.fromOffset(80, 16), Text = e.label, FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.text, TextStrokeTransparency = 0.5, TextXAlignment = Enum.TextXAlignment.Center, Parent = holder })
		local kc = K.key(holder, e.key, UDim2.new(0.5, 0, 0, 0), Vector2.new(0.5, 0)); kc.ZIndex = 3
		if e.id == "Skills" then
			badge = new("TextLabel", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(1, -4, 0, 6), Size = UDim2.fromOffset(22, 22), BackgroundColor3 = C.gold, Text = "0", FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.bg, Visible = false, ZIndex = 4, Parent = b }, { K.corner(11) })
		end
		b.MouseEnter:Connect(function() K.tween(b, 0.12, { Size = UDim2.fromOffset(66, 66), BackgroundTransparency = 0 }); K.tween(st, 0.12, { Transparency = 0 }) end)
		b.MouseLeave:Connect(function() K.tween(b, 0.2, { Size = UDim2.fromOffset(60, 60), BackgroundTransparency = 0.2 }); K.tween(st, 0.2, { Transparency = 0.45 }) end)
		b.MouseButton1Click:Connect(function()
			click()
			if e.id == "Spectate" then
				if Menu.onSpectate then Menu.onSpectate() end
			else
				Menu.toggle(not (Menu.open and Menu.current == e.id), e.id)
			end
		end)
	end
	local hint = K.label({ Name = "KeyboardOnly", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -92), Size = UDim2.fromOffset(300, 18), Text = "pressione  M  para usar o cursor", FontFace = FF.body, TextSize = 13, TextColor3 = C.text, TextTransparency = 0.35, TextStrokeTransparency = 0.7, TextXAlignment = Enum.TextXAlignment.Center, Parent = side })
	Menu.panel = side

	-- ===== janela principal =====
	local win = new("Frame", { Name = "MenuWindow", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(1180, 720), BackgroundColor3 = C.bg, BackgroundTransparency = 0.03, Visible = false, ZIndex = 10, Parent = gui }, { K.corner(6), K.stroke(C.line, 1, 0.9) })
	local blur = new("Frame", { Name = "Dim", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.new(4, 0, 4, 0), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, ZIndex = 9, Visible = false, Parent = gui })
	local scale = new("UIScale", { Parent = win })
	local function rescale()
		local vs = workspace.CurrentCamera.ViewportSize
		scale.Scale = math.clamp(math.min(vs.X / 1300, vs.Y / 800), 0.5, 0.88) / (hud.gui:FindFirstChildOfClass("UIScale") and hud.gui:FindFirstChildOfClass("UIScale").Scale or 1)
	end
	rescale(); workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
	-- coluna da esquerda
	local navCol = new("Frame", { Size = UDim2.new(0, 300, 1, 0), BackgroundColor3 = C.panel, BackgroundTransparency = 0.2, Parent = win }, { K.corner(6) })
	new("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.new(0, 1, 1, 0), BackgroundColor3 = C.line, BackgroundTransparency = 0.92, Parent = navCol })
	local secTitle = K.label({ Position = UDim2.fromOffset(32, 30), Size = UDim2.fromOffset(250, 40), Text = "LOJA", FontFace = FF.title, TextSize = 36, Parent = navCol })
	local secSub = K.label({ Position = UDim2.fromOffset(32, 72), Size = UDim2.fromOffset(250, 18), Text = "", FontFace = FF.body, TextSize = 15, TextColor3 = C.dim, Parent = navCol })
	local navList = new("Frame", { Position = UDim2.fromOffset(12, 112), Size = UDim2.new(1, -24, 0, #NAV * 56), BackgroundTransparency = 1, Parent = navCol }, { K.list(Enum.FillDirection.Vertical, 2) })
	local secDesc = K.label({ AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 32, 1, -26), Size = UDim2.new(1, -56, 0, 70), Text = "", FontFace = FF.body, TextSize = 14, TextColor3 = C.faint, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Bottom, Parent = navCol })
	local navBtns = {}
	for i, n in ipairs(NAV) do
		local b = new("TextButton", { LayoutOrder = i, AutoButtonColor = false, Text = "", Size = UDim2.new(1, 0, 0, 54), BackgroundColor3 = C.panel2, BackgroundTransparency = 1, Parent = navList }, { K.corner(4) })
		local acc = new("Frame", { Position = UDim2.fromOffset(8, 12), Size = UDim2.new(0, 3, 1, -24), BackgroundColor3 = C.red, Visible = false, Parent = b }, { K.corner(2) })
		local t = K.label({ Position = UDim2.fromOffset(22, 9), Size = UDim2.new(1, -90, 0, 22), Text = n.title, FontFace = FF.head, TextSize = 18, TextColor3 = C.dim, Parent = b })
		K.label({ Position = UDim2.fromOffset(22, 31), Size = UDim2.new(1, -90, 0, 16), Text = n.sub, FontFace = FF.body, TextSize = 13, TextColor3 = C.faint, Parent = b })
		if n.badge then
			new("TextLabel", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -12, 0.5, 0), Size = UDim2.fromOffset(46, 20), BackgroundColor3 = C.red, Text = n.badge, FontFace = FF.bodyB, TextSize = 11, TextColor3 = C.text, Parent = b }, { K.corner(3) })
		end
		b.MouseEnter:Connect(function() if Menu.current ~= n.id then K.tween(b, 0.12, { BackgroundTransparency = 0.6 }) end end)
		b.MouseLeave:Connect(function() if Menu.current ~= n.id then K.tween(b, 0.2, { BackgroundTransparency = 1 }) end end)
		b.MouseButton1Click:Connect(function() click(); Menu.select(n.id) end)
		navBtns[n.id] = { b = b, acc = acc, t = t }
	end
	-- cabeçalho: saldo
	local balBox = new("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -32, 0, 28), Size = UDim2.fromOffset(280, 70), BackgroundColor3 = C.panel, BackgroundTransparency = 0.2, Parent = win }, { K.corner(4), K.stroke(C.line, 1, 0.9) })
	new("TextLabel", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 18, 0.5, 0), Size = UDim2.fromOffset(34, 34), BackgroundColor3 = C.gold, Text = "$", FontFace = FF.title, TextSize = 20, TextColor3 = C.bg, Parent = balBox }, { K.corner(17) })
	K.label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, 12), Size = UDim2.fromOffset(160, 14), Text = "SALDO", FontFace = FF.bodyB, TextSize = 12, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Right, Parent = balBox })
	local balL = K.label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, 26), Size = UDim2.fromOffset(200, 34), Text = "$0", FontFace = FF.title, TextSize = 30, TextColor3 = C.gold, TextXAlignment = Enum.TextXAlignment.Right, Parent = balBox })
	local body = new("Frame", { Position = UDim2.fromOffset(332, 124), Size = UDim2.new(1, -364, 1, -184), BackgroundTransparency = 1, ClipsDescendants = true, Parent = win })
	local footL = K.label({ AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 332, 1, -18), Size = UDim2.new(1, -520, 0, 20), Text = "", FontFace = FF.body, TextSize = 14, TextColor3 = C.faint, Parent = win })
	local footR = K.label({ AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -32, 1, -18), Size = UDim2.fromOffset(200, 20), Text = "ESC fechar", FontFace = FF.bodyB, TextSize = 14, TextColor3 = C.dim, TextXAlignment = Enum.TextXAlignment.Right, Parent = win })
	K.closeButton(win, UDim2.new(1, -324, 0, 41), Vector2.new(1, 0), function() Menu.toggle(false) end)
	local builders = { Upgrades = buildUpgrades, Items = buildItems, Skills = buildSkills, Monsters = buildMonsters, Skins = buildSkins2, Hammers = buildHammers, Emotes = buildEmotes, Profile = buildProfile, Settings = buildSettings }
	for id, fn in pairs(builders) do
		local frame, refresh = fn(body)
		sections[id] = { frame = frame, refresh = refresh }
	end
	new("TextButton", { Name = "Modal", Modal = true, BackgroundTransparency = 1, Text = "", Size = UDim2.fromOffset(0, 0), Parent = win })
	Menu.cursorModal = new("TextButton", { Name = "CursorModal", Modal = true, BackgroundTransparency = 1, Text = "", Size = UDim2.fromOffset(0, 0), Visible = false, Parent = gui })
	Menu.window = win
	Menu.dim = blur

	local FOOT = { Upgrades = "Comprado com dinheiro guardado  ·  mantido entre partidas", Items = "Itens comprados são seus para sempre", Skills = "Clique duas vezes num talento para desbloquear",
		Monsters = "Você vira o monstro equipado quando for sorteado como Blinder",
		Skins = "Skins só mudam a aparência do monstro", Hammers = "O martelo equipado aparece na sua mão e para os outros jogadores", Emotes = "Clique num emote comprado para usar", Profile = "Estatísticas desde o primeiro dia", Settings = "Ajustes aplicados na hora" }
	function Menu.select(id: string)
		Menu.current = id
		for k, s in pairs(sections) do s.frame.Visible = k == id end
		for k, nb in pairs(navBtns) do
			local on = k == id
			nb.acc.Visible = on
			nb.b.BackgroundTransparency = on and 0.2 or 1
			nb.t.TextColor3 = on and C.text or C.dim
		end
		for _, n in ipairs(NAV) do
			if n.id == id then secTitle.Text = n.title; secSub.Text = n.sub; secDesc.Text = n.desc end
		end
		footL.Text = FOOT[id] or ""
		if sections[id] then sections[id].refresh() end
	end

	function Menu.refreshAll()
		local money = player:GetAttribute("Money") or 0
		bal.Text = "$" .. K.fmt(money); balL.Text = "$" .. K.fmt(money)
		local L = player:GetAttribute("Level") or 1
		lvNum.Text = tostring(L)
		local xp, need = player:GetAttribute("XP") or 0, player:GetAttribute("XPNeed") or 100
		setXP(xp / need)
		xpNum.Text = xp .. " / " .. need .. " XP"
		xpLeft.Text = (need - xp) .. " para o nível " .. (L + 1)
		local sp = player:GetAttribute("SkillPoints") or 0
		if badge then badge.Visible = sp > 0; badge.Text = tostring(sp) end
		if Menu.open and sections[Menu.current] then sections[Menu.current].refresh() end
	end
	local pending = false
	player.AttributeChanged:Connect(function()
		if pending then return end
		pending = true
		task.defer(function() pending = false; Menu.refreshAll() end)
	end)
	Menu.refreshAll()
	Menu.select("Upgrades")

	RunService.RenderStepped:Connect(function(dt)
		if not win.Visible then return end
		for _, p in ipairs(previews) do
			if p.section == Menu.current then
				p.a += dt * 0.6
				local t = p.target
				local a = p.avatar and math.sin(p.a * 0.8) * 0.55 or p.a
				p.cam.CFrame = CFrame.lookAt(t + Vector3.new(math.sin(a) * p.dist, p.dist * 0.12, -math.cos(a) * p.dist), t)
			end
		end
	end)
end

function Menu.toggle(state: boolean?, tab: string?)
	local w = Menu.window; if not w then return end
	if state == nil then state = not w.Visible end
	w.Visible = state
	Menu.dim.Visible = state
	Menu.open = state
	local GuiService = game:GetService("GuiService")
	if state then
		Menu.select(tab or Menu.current)
		w.Position = UDim2.fromScale(0.5, 0.52)
		K.tween(w, 0.3, { Position = UDim2.fromScale(0.5, 0.5) })
		-- controle: seleciona o primeiro botão para navegar com o direcional
		if K.inputMode() == "gamepad" then
			local first
			for _, d in ipairs(w:GetDescendants()) do
				if d:IsA("TextButton") and d.Visible and d.Name ~= "Modal" and d.AbsoluteSize.X > 60 then first = d; break end
			end
			GuiService.SelectedObject = first
		end
	elseif GuiService.SelectedObject and GuiService.SelectedObject:IsDescendantOf(w) then
		GuiService.SelectedObject = nil
	end
	UIS.MouseIconEnabled = state or cursorMode
end

function Menu.setCursorMode(on: boolean)
	cursorMode = on
	if Menu.cursorModal then Menu.cursorModal.Visible = on end
	UIS.MouseIconEnabled = on or Menu.open
end
function Menu.cursorMode() return cursorMode end

function Menu.setLobbyUI(visible: boolean)
	if Menu.panel then Menu.panel.Visible = visible end
	if not visible then
		if Menu.open then Menu.toggle(false) end
		if cursorMode then Menu.setCursorMode(false) end
	end
end

return Menu
