extends Control

const AUDIO_SYNTH_SCRIPT := preload("res://scripts/procedural_combat_audio.gd")
const CYAN := Color("#69e8ff")
const GOLD := Color("#ffc965")
const GREEN := Color("#5cf0b7")
const TEXT := Color("#e8f1f7")
const MUTED_TEXT := Color("#8fa5b3")
const PANEL := Color("#0b1727")
const PANEL_HOVER := Color("#12283d")

const CUE_HOTKEYS := {
	KEY_1: &"vibro_blade",
	KEY_2: &"twin_vibro_daggers",
	KEY_3: &"heavy_smash",
	KEY_4: &"concussive_shove",
}

const CUE_BUTTONS := [
	{
		"id": &"vibro_blade",
		"label": "[1]  VIBRO-BLADE",
		"summary": "Accelerating air cut  •  broad steel/body contact  •  unstable edge residue",
	},
	{
		"id": &"twin_vibro_daggers",
		"label": "[2]  TWIN VIBRO-DAGGERS",
		"summary": "Two opposed light cuts at 85 / 145 ms  •  stronger second punctuation",
	},
	{
		"id": &"heavy_smash",
		"label": "[3]  HEAVY SMASH",
		"summary": "Low air displacement  •  120–350 Hz crushing body  •  stressed-metal tick",
	},
	{
		"id": &"concussive_shove",
		"label": "[4]  CONCUSSIVE SHOVE",
		"summary": "Compact armor contact  •  no heavy sub  •  stereo pressure tail spreads outward",
	},
]

const CUE_DETAILS := {
	&"vibro_blade": "PHYSICAL READ: military steel driven past an ordinary edge. Contact onset is fixed at 100 ms.",
	&"twin_vibro_daggers": "PHYSICAL READ: unequal high-speed edges move in opposite stereo directions. Contacts stay fixed at 85 and 145 ms.",
	&"heavy_smash": "PHYSICAL READ: cybernetic mass crushes armor and deck plating. Weight is low-mid body, with sub only supporting it.",
	&"concussive_shove": "PHYSICAL READ: chest/armor momentum transfer expands into an airy pressure consequence tied to displacement.",
	&"sequence": "ORDER: Vibro-Blade → Twin Vibro-Daggers → Heavy Smash → Concussive Shove. Gaps are intentionally dry and sparse.",
}

var audio_synth
var status_label: Label
var detail_label: Label
var variation_label: Label
var mute_button: Button
var volume_label: Label

var _active_cue_id: StringName = &""
var _active_cue_name := "NO CUE PLAYING"
var _active_duration := 1.0
var _active_contacts := PackedFloat32Array()
var _active_started_msec := 0
var _smoke_frames_remaining := -1

func _ready() -> void:
	audio_synth = AUDIO_SYNTH_SCRIPT.new()
	audio_synth.name = "ProceduralCombatAudio"
	add_child(audio_synth)
	audio_synth.cue_started.connect(_on_cue_started)
	audio_synth.mute_changed.connect(_on_mute_changed)
	_build_interface()
	queue_redraw()

	if OS.get_cmdline_user_args().has("--smoke-test"):
		call_deferred("_begin_smoke_test")

func _process(_delta: float) -> void:
	queue_redraw()
	if _smoke_frames_remaining > 0:
		_smoke_frames_remaining -= 1
	elif _smoke_frames_remaining == 0:
		var pending_frames: int = audio_synth.get_pending_frame_count()
		var generator_skips: int = audio_synth.get_generator_skips()
		audio_synth.shutdown()
		print(
			"[Godot Combat Audio Spike] HEADLESS SMOKE PASS; pending_frames=%d generator_skips=%d" % [
				pending_frames,
				generator_skips,
			]
		)
		audio_synth.queue_free()
		audio_synth = null
		_smoke_frames_remaining = -1
		get_tree().create_timer(0.10).timeout.connect(_quit_after_smoke)

func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if CUE_HOTKEYS.has(event.keycode):
		_audition(CUE_HOTKEYS[event.keycode] as StringName)
		get_viewport().set_input_as_handled()
		return
	match event.keycode:
		KEY_SPACE:
			_audition_sequence()
		KEY_R:
			audio_synth.reset_variation_sequence()
			_active_cue_id = &""
			_active_cue_name = "VARIATION RESET"
			variation_label.text = "Variation sequence reset to 1 / 6"
			status_label.text = "STOPPED — deterministic variation and queued audio reset"
		KEY_M:
			audio_synth.toggle_muted()
		KEY_ESCAPE:
			get_tree().quit()
		_:
			return
	get_viewport().set_input_as_handled()

func _build_interface() -> void:
	var margin := MarginContainer.new()
	margin.name = "AuditionLayout"
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.offset_left = 72.0
	margin.offset_top = 38.0
	margin.offset_right = -72.0
	margin.offset_bottom = -148.0
	add_child(margin)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	margin.add_child(column)

	var title := Label.new()
	title.text = "GODOT-NATIVE PROCEDURAL COMBAT AUDIO"
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", CYAN)
	column.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "PHYSICAL FIRST  →  SCIENCE-FANTASY SECOND     |     48 kHz AudioStreamGenerator     |     PRESENTATION ONLY"
	subtitle.add_theme_font_size_override("font_size", 15)
	subtitle.add_theme_color_override("font_color", MUTED_TEXT)
	column.add_child(subtitle)

	var rule := HSeparator.new()
	rule.modulate = Color(CYAN, 0.42)
	column.add_child(rule)

	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(grid)

	for definition in CUE_BUTTONS:
		var cue_id := definition["id"] as StringName
		var button := Button.new()
		button.name = str(cue_id).to_pascal_case()
		button.text = "%s\n%s" % [definition["label"], definition["summary"]]
		button.custom_minimum_size = Vector2(0.0, 82.0)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.add_theme_font_size_override("font_size", 16)
		button.add_theme_color_override("font_color", TEXT)
		button.add_theme_color_override("font_hover_color", Color.WHITE)
		button.add_theme_stylebox_override("normal", _button_style(PANEL, CYAN, 0.28))
		button.add_theme_stylebox_override("hover", _button_style(PANEL_HOVER, CYAN, 0.72))
		button.add_theme_stylebox_override("pressed", _button_style(Color("#18344b"), GOLD, 0.85))
		button.pressed.connect(_audition.bind(cue_id))
		grid.add_child(button)

	detail_label = Label.new()
	detail_label.text = "Select one move. Every label states the intended read; only developer listening can decide whether the sound achieves it."
	detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	detail_label.add_theme_font_size_override("font_size", 16)
	detail_label.add_theme_color_override("font_color", GOLD)
	column.add_child(detail_label)

	var controls := HBoxContainer.new()
	controls.add_theme_constant_override("separation", 12)
	column.add_child(controls)

	var sequence_button := Button.new()
	sequence_button.text = "[SPACE]  AUDITION ALL FOUR"
	sequence_button.custom_minimum_size = Vector2(250.0, 42.0)
	sequence_button.add_theme_stylebox_override("normal", _button_style(Color("#102536"), GREEN, 0.42))
	sequence_button.add_theme_stylebox_override("hover", _button_style(Color("#17374b"), GREEN, 0.85))
	sequence_button.pressed.connect(_audition_sequence)
	controls.add_child(sequence_button)

	mute_button = Button.new()
	mute_button.text = "[M]  SOUND ON"
	mute_button.custom_minimum_size = Vector2(148.0, 42.0)
	mute_button.pressed.connect(audio_synth.toggle_muted)
	controls.add_child(mute_button)

	var reset_button := Button.new()
	reset_button.text = "[R]  RESET VARIATION"
	reset_button.custom_minimum_size = Vector2(195.0, 42.0)
	reset_button.pressed.connect(_reset_from_button)
	controls.add_child(reset_button)

	volume_label = Label.new()
	volume_label.text = "OUTPUT  -6 dB"
	volume_label.custom_minimum_size = Vector2(112.0, 42.0)
	volume_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	volume_label.add_theme_color_override("font_color", MUTED_TEXT)
	controls.add_child(volume_label)

	var volume_slider := HSlider.new()
	volume_slider.min_value = -18.0
	volume_slider.max_value = 0.0
	volume_slider.step = 1.0
	volume_slider.value = -6.0
	volume_slider.custom_minimum_size = Vector2(160.0, 42.0)
	volume_slider.value_changed.connect(_on_volume_changed)
	controls.add_child(volume_slider)

	variation_label = Label.new()
	variation_label.text = "Next deterministic variation: 1 / 6"
	variation_label.add_theme_color_override("font_color", MUTED_TEXT)
	controls.add_child(variation_label)

	status_label = Label.new()
	status_label.text = "READY — keys 1–4 play one move; Space plays the four-move sequence; Escape quits"
	status_label.add_theme_font_size_override("font_size", 17)
	status_label.add_theme_color_override("font_color", TEXT)
	column.add_child(status_label)

func _button_style(fill: Color, border: Color, border_alpha: float) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = Color(border, border_alpha)
	style.set_border_width_all(2)
	style.set_corner_radius_all(7)
	style.content_margin_left = 16.0
	style.content_margin_right = 16.0
	return style

func _audition(cue_id: StringName) -> void:
	audio_synth.audition(cue_id)

func _audition_sequence() -> void:
	audio_synth.audition_sequence()

func _reset_from_button() -> void:
	audio_synth.reset_variation_sequence()
	_active_cue_id = &""
	_active_cue_name = "VARIATION RESET"
	variation_label.text = "Variation sequence reset to 1 / 6"
	status_label.text = "STOPPED — deterministic variation and queued audio reset"

func _on_cue_started(
	cue_id: StringName,
	display_name: String,
	variation_index: int,
	duration_seconds: float,
	contacts: PackedFloat32Array
) -> void:
	_active_cue_id = cue_id
	_active_cue_name = display_name
	_active_duration = duration_seconds
	_active_contacts = contacts
	_active_started_msec = Time.get_ticks_msec()
	status_label.text = "PLAYING — %s  |  variation %d / 6  |  contacts %s" % [
		display_name,
		variation_index + 1,
		_format_contacts(contacts),
	]
	detail_label.text = str(CUE_DETAILS.get(cue_id, ""))
	variation_label.text = "Played variation %d / 6" % (variation_index + 1)
	queue_redraw()

func _on_mute_changed(muted: bool) -> void:
	mute_button.text = "[M]  SOUND OFF" if muted else "[M]  SOUND ON"
	status_label.text = "MUTED — synthesis continues silently" if muted else "SOUND ON — ready to audition"

func _on_volume_changed(value: float) -> void:
	audio_synth.set_output_db(value)
	volume_label.text = "OUTPUT  %d dB" % roundi(value)

func _format_contacts(contacts: PackedFloat32Array) -> String:
	var labels := PackedStringArray()
	for contact in contacts:
		labels.append("%d ms" % roundi(contact * 1000.0))
	return " / ".join(labels)

func _draw() -> void:
	var bounds := size
	for band in 24:
		var ratio := float(band) / 23.0
		var color := Color(
			0.006 + ratio * 0.014,
			0.011 + ratio * 0.018,
			0.024 + ratio * 0.030,
			1.0
		)
		draw_rect(Rect2(0.0, ratio * bounds.y, bounds.x, bounds.y / 23.0 + 2.0), color)

	draw_circle(Vector2(bounds.x * 0.83, bounds.y * 0.22), 190.0, Color(0.08, 0.32, 0.38, 0.055))
	draw_circle(Vector2(bounds.x * 0.14, bounds.y * 0.70), 250.0, Color(0.32, 0.16, 0.05, 0.045))
	_draw_timeline(bounds)

func _draw_timeline(bounds: Vector2) -> void:
	var left := 76.0
	var right := bounds.x - 76.0
	var y := bounds.y - 72.0
	var font := ThemeDB.fallback_font
	draw_rect(Rect2(left - 12.0, y - 48.0, right - left + 24.0, 83.0), Color(0.004, 0.009, 0.018, 0.86))
	draw_line(Vector2(left, y), Vector2(right, y), Color(MUTED_TEXT, 0.45), 3.0)
	draw_string(font, Vector2(left, y - 20.0), "SEMANTIC CONTACT TIMELINE — %s" % _active_cue_name, HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, MUTED_TEXT)

	if _active_cue_id == &"":
		return
	for contact in _active_contacts:
		var contact_x := lerpf(left, right, clampf(contact / _active_duration, 0.0, 1.0))
		draw_line(Vector2(contact_x, y - 11.0), Vector2(contact_x, y + 13.0), GOLD, 3.0)
		draw_string(font, Vector2(contact_x - 28.0, y + 30.0), "%d ms" % roundi(contact * 1000.0), HORIZONTAL_ALIGNMENT_CENTER, 56.0, 13, GOLD)

	var elapsed := float(Time.get_ticks_msec() - _active_started_msec) / 1000.0
	var progress := clampf(elapsed / maxf(0.001, _active_duration), 0.0, 1.0)
	var cursor_x := lerpf(left, right, progress)
	draw_line(Vector2(left, y), Vector2(cursor_x, y), CYAN, 4.0)
	draw_circle(Vector2(cursor_x, y), 6.0, CYAN)

func _begin_smoke_test() -> void:
	var passed: bool = bool(audio_synth.run_render_smoke_test())
	if not passed:
		push_error("[Godot Combat Audio Spike] HEADLESS SMOKE FAILED")
		get_tree().quit(1)
		return
	audio_synth.reset_variation_sequence()
	audio_synth.audition_sequence()
	_smoke_frames_remaining = 12

func _quit_after_smoke() -> void:
	get_tree().quit(0)
