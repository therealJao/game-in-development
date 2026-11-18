-- BLINDER :: kit de UI (identidade própria: tinta azul-noite + âmbar, formas arredondadas)
local TS = game:GetService("TweenService")
local K = {}

K.C = {
	bg      = Color3.fromRGB(10, 12, 20),
	panel   = Color3.fromRGB(17, 20, 32),
	panel2  = Color3.fromRGB(26, 30, 46),
	hover   = Color3.fromRGB(38, 44, 66),
	line    = Color3.fromRGB(255, 236, 200),
	text    = Color3.fromRGB(242, 234, 216),
	dim     = Color3.fromRGB(158, 156, 170),
	faint   = Color3.fromRGB(98, 100, 118),
	red     = Color3.fromRGB(234, 60, 66),
	redDim  = Color3.fromRGB(110, 22, 28),
	gold    = Color3.fromRGB(255, 176, 59),
	green   = Color3.fromRGB(96, 206, 122),
	blue    = Color3.fromRGB(88, 158, 240),
	purple  = Color3.fromRGB(162, 106, 240),
	orange  = Color3.fromRGB(240, 142, 62),
	teal    = Color3.fromRGB(70, 210, 196),
}

local function fam(name, weight)
	return Font.new("rbxasset://fonts/families/" .. name .. ".json", weight or Enum.FontWeight.Regular)
end
K.Font = {
	title = fam("TitilliumWeb", Enum.FontWeight.Bold),
	head  = fam("TitilliumWeb", Enum.FontWeight.Bold),
	num   = fam("TitilliumWeb", Enum.FontWeight.SemiBold),
	body  = fam("TitilliumWeb", Enum.FontWeight.Regular),
	bodyM = fam("TitilliumWeb", Enum.FontWeight.SemiBold),
	bodyB = fam("TitilliumWeb", Enum.FontWeight.Bold),
	logo  = fam("Creepster", Enum.FontWeight.Regular),
	type  = fam("SpecialElite", Enum.FontWeight.Regular),
}
-- compatibilidade com código antigo (Enum.Font)
K.F = { title = Enum.Font.Oswald, body = Enum.Font.RobotoCondensed, num = Enum.Font.Oswald, ui = Enum.Font.RobotoCondensed }

function K.new(class: string, props: { [string]: any }?, children: { Instance }?)
	local o = Instance.new(class)
	if o:IsA("GuiObject") then (o :: any).BorderSizePixel = 0 end
	local parent
	if props then
		parent = props.Parent
		for k, v in pairs(props) do if k ~= "Parent" then (o :: any)[k] = v end end
	end
	if children then for _, c in ipairs(children) do c.Parent = o end end
	if parent then o.Parent = parent end
	return o
end
local new = K.new

-- cantos bem arredondados (raios pequenos são ampliados para o estilo "pílula" do Blinder)
function K.corner(r: number?)
	r = r or 4
	if r <= 6 then r = r * 2.5 end
	return new("UICorner", { CornerRadius = UDim.new(0, r) })
end
function K.stroke(color: Color3?, th: number?, tr: number?)
	return new("UIStroke", { Color = color or K.C.line, Thickness = th or 1, Transparency = tr or 0.9, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end
function K.pad(t: number, r: number?, b: number?, l: number?)
	return new("UIPadding", { PaddingTop = UDim.new(0, t), PaddingRight = UDim.new(0, r or t), PaddingBottom = UDim.new(0, b or t), PaddingLeft = UDim.new(0, l or r or t) })
end
function K.list(dir, padding: number?, halign, valign)
	return new("UIListLayout", { FillDirection = dir or Enum.FillDirection.Vertical, Padding = UDim.new(0, padding or 0), SortOrder = Enum.SortOrder.LayoutOrder,
		HorizontalAlignment = halign or Enum.HorizontalAlignment.Left, VerticalAlignment = valign or Enum.VerticalAlignment.Top })
end
function K.grad(c0: Color3, c1: Color3, rot: number?, t0: number?, t1: number?)
	return new("UIGradient", { Color = ColorSequence.new(c0, c1), Rotation = rot or 90, Transparency = NumberSequence.new(t0 or 0, t1 or 0) })
end
function K.tween(o: Instance, t: number, props, style, dir)
	local tw = TS:Create(o, TweenInfo.new(t, style or Enum.EasingStyle.Quint, dir or Enum.EasingDirection.Out), props)
	tw:Play()
	return tw
end

-- texto com padrões do tema (FontFace)
function K.label(props)
	local base = { BackgroundTransparency = 1, FontFace = K.Font.body, TextColor3 = K.C.text, TextSize = 16, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Center }
	for k, v in pairs(props) do base[k] = v end
	if base.Font then base.FontFace = nil end
	return new("TextLabel", base)
end

-- barra fina: retorna frame, set(0..1), fill
function K.bar(parent, pos: UDim2, size: UDim2, color: Color3, name: string?)
	local back = new("Frame", { Name = name or "Bar", Position = pos, Size = size, BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.88, ClipsDescendants = true, Parent = parent }, { K.corner(2) })
	local ghost = new("Frame", { Name = "Ghost", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.7, Parent = back }, { K.corner(2) })
	local fill = new("Frame", { Name = "Fill", Size = UDim2.fromScale(1, 1), BackgroundColor3 = color, Parent = back }, { K.corner(2) })
	local last = 1
	local function set(v: number)
		v = math.clamp(v, 0, 1)
		if math.abs(v - last) < 0.0005 then return end
		fill.Size = UDim2.fromScale(v, 1)
		if v < last then
			TS:Create(ghost, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, 0, false, 0.2), { Size = UDim2.fromScale(v, 1) }):Play()
		else
			ghost.Size = UDim2.fromScale(v, 1)
		end
		last = v
	end
	return back, set, fill
end

K.onClick = nil -- (callback de som definido pelo cliente)
function K.button(props, onClick)
	local base = { AutoButtonColor = false, BackgroundColor3 = K.C.panel2, FontFace = K.Font.bodyB, TextColor3 = K.C.text, TextSize = 15 }
	for k, v in pairs(props) do base[k] = v end
	if base.Font then base.FontFace = nil end
	local b = new("TextButton", base, { K.corner(4), K.stroke(K.C.line, 1, 0.9) })
	local baseColor = b.BackgroundColor3
	b.MouseEnter:Connect(function() K.tween(b, 0.12, { BackgroundColor3 = baseColor:Lerp(Color3.new(1, 1, 1), 0.08) }) end)
	b.MouseLeave:Connect(function() K.tween(b, 0.2, { BackgroundColor3 = baseColor }) end)
	b:GetPropertyChangedSignal("BackgroundColor3"):Connect(function() end)
	if onClick then b.MouseButton1Click:Connect(function() if K.onClick then K.onClick() end; onClick() end) end
	return b
end

-- chip de tecla (ex: [M])
-- chip de tecla. Guarda a tecla do teclado (kb) e, opcionalmente, o botão do controle (gp).
-- O cliente troca o texto conforme o aparelho (teclado / controle / toque).
function K.key(parent, text: string, pos: UDim2?, anchor: any, gp: string?)
	if type(anchor) == "string" then gp = anchor; anchor = nil end
	local l = new("TextLabel", { Name = "KeyChip", AnchorPoint = anchor or Vector2.new(0, 0), Position = pos or UDim2.new(), Size = UDim2.fromOffset(math.max(22, #text * 9 + 10), 22),
		BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.88, Text = text, FontFace = K.Font.bodyB, TextSize = 13, TextColor3 = K.C.text, Parent = parent }, { K.corner(3) })
	l:SetAttribute("kb", text)
	if gp then l:SetAttribute("gp", gp) end
	return l
end

-- aparelho atual: "keyboard" | "gamepad" | "touch"
function K.inputMode(): string
	local UIS = game:GetService("UserInputService")
	local last = UIS:GetLastInputType()
	if last == Enum.UserInputType.Touch then return "touch" end
	if tostring(last):find("Gamepad") then return "gamepad" end
	if UIS.TouchEnabled and not UIS.KeyboardEnabled then return "touch" end
	return "keyboard"
end

-- atualiza todos os chips de tecla dentro de `root` para o aparelho atual
function K.applyInputMode(root: Instance, mode: string)
	for _, d in ipairs(root:GetDescendants()) do
		if d.Name == "KeyChip" and d:IsA("TextLabel") then
			local kb, gp = d:GetAttribute("kb"), d:GetAttribute("gp")
			if mode == "touch" then d.Visible = false
			elseif mode == "gamepad" then d.Visible = gp ~= nil and gp ~= ""; d.Text = gp or ""
			else d.Visible = true; d.Text = kb or "" end
			if d.Visible then d.Size = UDim2.fromOffset(math.max(22, #d.Text * 9 + 10), 22) end
		elseif d.Name == "KeyboardOnly" and d:IsA("GuiObject") then
			d.Visible = mode == "keyboard"
		end
	end
end

-- maiúsculas com acentos (string.upper não converte UTF-8)
local ACC = { ["á"] = "Á", ["à"] = "À", ["â"] = "Â", ["ã"] = "Ã", ["é"] = "É", ["ê"] = "Ê", ["í"] = "Í", ["ó"] = "Ó", ["ô"] = "Ô", ["õ"] = "Õ", ["ú"] = "Ú", ["ç"] = "Ç" }
function K.upper(s: string): string
	local out = string.upper(s)
	for lo, up in pairs(ACC) do out = out:gsub(lo, up) end
	return out
end

-- botão de fechar desenhado (sem depender de símbolos da fonte)
function K.closeButton(parent, pos: UDim2, anchor: Vector2?, onClick)
	local b = K.button({ AnchorPoint = anchor or Vector2.new(1, 0), Position = pos, Size = UDim2.fromOffset(44, 44), Text = "", BackgroundColor3 = K.C.panel2, Parent = parent }, onClick)
	for _, r in ipairs({ 45, -45 }) do
		new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(18, 2), Rotation = r, BackgroundColor3 = K.C.text, Parent = b })
	end
	return b
end

function K.fmt(n: number): string
	local s = tostring(math.floor(n))
	local neg = s:sub(1, 1) == "-"
	if neg then s = s:sub(2) end
	local out = s:reverse():gsub("(%d%d%d)", "%1."):reverse()
	if out:sub(1, 1) == "." then out = out:sub(2) end
	return (neg and "-" or "") .. out
end

return K
