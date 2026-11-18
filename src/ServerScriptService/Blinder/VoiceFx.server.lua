-- BLINDER :: voz do monstro no chat de voz
-- Quem vira o monstro tem a voz modificada (mais grave, distorcida e com eco) para todo mundo que ouvir.
-- Usa a API de áudio nova (VoiceChatService.UseAudioApi = Enabled): AudioDeviceInput -> efeitos -> AudioEmitter.
local Players = game:GetService("Players")

-- timbre por tipo de monstro (pitch < 1 = grave)
local VOICES = {
	Default     = { pitch = 0.68, dist = 0.32, echo = 0.18, delay = 0.09 },
	Blinder     = { pitch = 0.66, dist = 0.30, echo = 0.20, delay = 0.10 },
	Scarecrow   = { pitch = 0.74, dist = 0.40, echo = 0.15, delay = 0.07 },
	Animatronic = { pitch = 0.80, dist = 0.55, echo = 0.12, delay = 0.05 }, -- robótica
	Doll        = { pitch = 1.38, dist = 0.12, echo = 0.30, delay = 0.14 }, -- fininha e assombrada
	Oni         = { pitch = 0.58, dist = 0.38, echo = 0.16, delay = 0.08 },
	Shadow      = { pitch = 0.62, dist = 0.20, echo = 0.38, delay = 0.18 },
}

local FX_NAME = "MonsterVoiceFx"

local function findVoiceWire(input: Instance, char: Model): Wire?
	for _, root in ipairs({ char, input.Parent }) do
		if root then
			for _, d in ipairs(root:GetDescendants()) do
				if d:IsA("Wire") and d.SourceInstance == input then return d end
			end
		end
	end
	return nil
end

local function wire(parent, a, b)
	local w = Instance.new("Wire")
	w.SourceInstance = a; w.TargetInstance = b
	w.Parent = parent
	return w
end

local function apply(plr: Player)
	local char = plr.Character
	if not char then return end
	local input = plr:FindFirstChildOfClass("AudioDeviceInput")
	if not input then return end -- jogador sem chat de voz
	local want = plr:GetAttribute("Role") == "Monster"
	local fx = char:FindFirstChild(FX_NAME)
	if want and not fx then
		local main = findVoiceWire(input, char)
		if not main then return end -- emissor ainda não criado; tenta de novo no próximo ciclo
		local v = VOICES[plr:GetAttribute("MonsterType") or ""] or VOICES.Default
		fx = Instance.new("Folder"); fx.Name = FX_NAME
		local pitch = Instance.new("AudioPitchShifter"); pitch.Pitch = v.pitch; pitch.Parent = fx
		local dist = Instance.new("AudioDistortion"); dist.Level = v.dist; dist.Parent = fx
		local echo = Instance.new("AudioEcho"); echo.DelayTime = v.delay; echo.Feedback = v.echo; echo.WetLevel = -8; echo.Parent = fx
		wire(fx, input, pitch)
		wire(fx, pitch, dist)
		wire(fx, dist, echo)
		local ref = Instance.new("ObjectValue"); ref.Name = "MainWire"; ref.Value = main; ref.Parent = fx
		fx.Parent = char
		main.SourceInstance = echo -- o emissor agora toca a voz já modificada
	elseif not want and fx then
		local ref = fx:FindFirstChild("MainWire")
		if ref and ref.Value then (ref.Value :: Wire).SourceInstance = input end
		fx:Destroy()
	end
end

-- ciclo leve: cobre troca de papel, morph do personagem e entrada tardia no voice
task.spawn(function()
	while true do
		for _, plr in ipairs(Players:GetPlayers()) do
			local ok, err = pcall(apply, plr)
			if not ok then warn("[BLINDER] VoiceFx:", err) end
		end
		task.wait(1)
	end
end)
