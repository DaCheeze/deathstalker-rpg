extends Control

const ProductionSource = preload("res://scripts/production_audio_source.gd")
const Catalog = preload("res://scripts/review_catalog.gd")
const ExactVariation = preload("res://scripts/exact_variation_player.gd")
const Checks = preload("res://scripts/listening_harness_checks.gd")

const CYAN := Color("#68e7ff")
const GOLD := Color("#ffc86a")
const GREEN := Color("#63e6aa")
const TEXT := Color("#eaf3f8")
const MUTED_TEXT := Color("#91a8b6")
const PANEL := Color("#0a1727")
const PANEL_HOVER := Color("#112b42")
const DANGER := Color("#ff7f83")
const CUE_KEYCODES := [KEY_1, KEY_2, KEY_3, KEY_4, KEY_5, KEY_6, KEY_7, KEY_8, KEY_9, KEY_0]

var _synth: Variant
var _headless_smoke := false
var _audio_mode := "auto"
var _current_cue_index := 0
var _current_variation := 0
var _sequence_token := 0
var _sequence_active := false
var _sequence_render_count := 0
var _last_started_msec := 0
var _last_duration_seconds := 0.0

var _cue_buttons: Array[Button] = []
var _variation_buttons: Array[Button] = []
var _cue_name_label: Label
var _variation_label: Label
var _detail_label: Label
var _avoid_label: Label
var _timing_label: Label
var _status_label: Label
var _metrics_label: Label
var _mute_button: Button
var _volume_label: Label


func _ready() -> void:
	_headless_smoke = OS.get_cmdline_user_args().has("--smoke-test")
	_audio_mode = _select_audio_mode()
	if _audio_mode.is_empty():
		get_tree().quit(1)
		return
	var synth_script := ProductionSource.load_script()
	if synth_script == null:
		push_error("Listening harness could not load the live production synth.")
		get_tree().quit(1)
		return
	_synth = synth_script.new()
	if not ProductionSource.install_dependencies(_synth, _audio_mode):
		push_error("Listening harness could not load the live hybrid audio dependencies.")
		_synth.free()
		_synth = null
		get_tree().quit(1)
		return
	_synth.name = "LiveProductionProceduralCombatAudio"
	_synth.set_output_suppressed(_headless_smoke)
	add_child(_synth)
	_build_interface()
	_select_cue(0, false)
	_select_variation(0, false)
	queue_redraw()
	if _headless_smoke:
		call_deferred("_run_headless_smoke")


func _select_audio_mode() -> String:
	var selected_mode := "auto"
	var selector_seen := false
	for argument in OS.get_cmdline_user_args():
		if not argument.begins_with("--audio="):
			continue
		if selector_seen:
			push_error("Listening harness audio selector may be provided only once.")
			return ""
		selector_seen = true
		selected_mode = argument.trim_prefix("--audio=")
	if not ["auto", "procedural", "licensed"].has(selected_mode):
		push_error(
			"Unknown listening harness audio mode '%s'; expected auto, procedural, or licensed."
			% selected_mode
		)
		return ""
	return selected_mode


func _process(_delta: float) -> void:
	queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	var key_event := event as InputEventKey
	var cue_key_index := CUE_KEYCODES.find(key_event.keycode)
	if cue_key_index >= 0:
		_select_cue(cue_key_index, true)
		get_viewport().set_input_as_handled()
		return
	match key_event.keycode:
		KEY_LEFT, KEY_Q:
			_select_variation(posmod(_current_variation - 1, Catalog.VARIATION_COUNT), true)
		KEY_RIGHT, KEY_E:
			_select_variation(posmod(_current_variation + 1, Catalog.VARIATION_COUNT), true)
		KEY_SPACE, KEY_ENTER, KEY_KP_ENTER:
			_replay_selected()
		KEY_A:
			_play_current_six()
		KEY_F:
			_play_full_matrix()
		KEY_S:
			_stop_review("STOPPED — queued playback and review sequence cleared")
		KEY_M:
			_toggle_mute()
		KEY_R:
			_reset_review()
		KEY_ESCAPE:
			get_tree().quit()
		_:
			return
	get_viewport().set_input_as_handled()


func _build_interface() -> void:
	var margin := MarginContainer.new()
	margin.name = "ReviewLayout"
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.offset_left = 54.0
	margin.offset_top = 30.0
	margin.offset_right = -54.0
	margin.offset_bottom = -112.0
	add_child(margin)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	margin.add_child(column)

	var title := Label.new()
	title.text = "PRODUCTION COMBAT AUDIO — LISTENING HARNESS"
	title.add_theme_font_size_override("font_size", 29)
	title.add_theme_color_override("font_color", CYAN)
	column.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "LIVE HYBRID GODOT AUDIO  •  MODE %s  •  SEVEN LICENSED-ELIGIBLE WEAPON CUES + THREE PROCEDURAL FAMILIES  •  −9 dB" % _audio_mode.to_upper()
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", MUTED_TEXT)
	column.add_child(subtitle)

	var rule := HSeparator.new()
	rule.modulate = Color(CYAN, 0.40)
	column.add_child(rule)

	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 18)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(body)

	var cue_column := VBoxContainer.new()
	cue_column.custom_minimum_size = Vector2(400.0, 0.0)
	cue_column.add_theme_constant_override("separation", 3)
	body.add_child(cue_column)

	var cue_header := Label.new()
	cue_header.text = "CUE — keys 1–9 / 0 select"
	cue_header.add_theme_color_override("font_color", GOLD)
	cue_header.add_theme_font_size_override("font_size", 15)
	cue_column.add_child(cue_header)

	var cue_group := ButtonGroup.new()
	for cue_index_value in Catalog.CUES.size():
		var definition: Dictionary = Catalog.CUES[cue_index_value]
		var button := Button.new()
		button.name = "Cue%s" % str(definition["id"]).to_pascal_case()
		button.text = "[%s]  %s\n%s" % [definition["key"], definition["name"], definition["summary"]]
		button.custom_minimum_size = Vector2(0.0, 40.0)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.toggle_mode = true
		button.button_group = cue_group
		button.add_theme_font_size_override("font_size", 13)
		button.add_theme_color_override("font_color", TEXT)
		button.add_theme_color_override("font_pressed_color", Color.WHITE)
		button.add_theme_stylebox_override("normal", _button_style(PANEL, CYAN, 0.22))
		button.add_theme_stylebox_override("hover", _button_style(PANEL_HOVER, CYAN, 0.65))
		button.add_theme_stylebox_override("pressed", _button_style(Color("#15364a"), GOLD, 0.95))
		button.pressed.connect(_select_cue.bind(cue_index_value, true))
		cue_column.add_child(button)
		_cue_buttons.append(button)

	var review_column := VBoxContainer.new()
	review_column.add_theme_constant_override("separation", 9)
	review_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(review_column)

	_cue_name_label = Label.new()
	_cue_name_label.add_theme_font_size_override("font_size", 24)
	_cue_name_label.add_theme_color_override("font_color", TEXT)
	review_column.add_child(_cue_name_label)

	_variation_label = Label.new()
	_variation_label.add_theme_font_size_override("font_size", 17)
	_variation_label.add_theme_color_override("font_color", GOLD)
	review_column.add_child(_variation_label)

	var variation_row := HBoxContainer.new()
	variation_row.add_theme_constant_override("separation", 7)
	review_column.add_child(variation_row)

	var variation_group := ButtonGroup.new()
	for variation_index in Catalog.VARIATION_COUNT:
		var button := Button.new()
		button.name = "Variation%d" % (variation_index + 1)
		button.text = str(variation_index + 1)
		button.tooltip_text = "Select deterministic variation %d of 6" % (variation_index + 1)
		button.custom_minimum_size = Vector2(52.0, 40.0)
		button.toggle_mode = true
		button.button_group = variation_group
		button.add_theme_font_size_override("font_size", 16)
		button.add_theme_stylebox_override("normal", _button_style(PANEL, CYAN, 0.28))
		button.add_theme_stylebox_override("hover", _button_style(PANEL_HOVER, CYAN, 0.70))
		button.add_theme_stylebox_override("pressed", _button_style(Color("#173b4b"), GREEN, 0.95))
		button.pressed.connect(_select_variation.bind(variation_index, true))
		variation_row.add_child(button)
		_variation_buttons.append(button)

	var variation_help := Label.new()
	variation_help.text = "← / Q and → / E change variation. Selection is silent; Space or Enter replays it."
	variation_help.add_theme_color_override("font_color", MUTED_TEXT)
	variation_help.add_theme_font_size_override("font_size", 13)
	review_column.add_child(variation_help)

	var detail_panel := PanelContainer.new()
	detail_panel.add_theme_stylebox_override("panel", _panel_style())
	detail_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	review_column.add_child(detail_panel)

	var detail_column := VBoxContainer.new()
	detail_column.add_theme_constant_override("separation", 7)
	detail_panel.add_child(detail_column)

	_detail_label = Label.new()
	_detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_detail_label.add_theme_font_size_override("font_size", 16)
	_detail_label.add_theme_color_override("font_color", TEXT)
	detail_column.add_child(_detail_label)

	_avoid_label = Label.new()
	_avoid_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_avoid_label.add_theme_font_size_override("font_size", 14)
	_avoid_label.add_theme_color_override("font_color", DANGER)
	detail_column.add_child(_avoid_label)

	_timing_label = Label.new()
	_timing_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_timing_label.add_theme_color_override("font_color", MUTED_TEXT)
	detail_column.add_child(_timing_label)

	var action_grid := GridContainer.new()
	action_grid.columns = 3
	action_grid.add_theme_constant_override("h_separation", 8)
	action_grid.add_theme_constant_override("v_separation", 8)
	review_column.add_child(action_grid)

	_add_action_button(action_grid, "[SPACE] REPLAY", _replay_selected, GREEN)
	_add_action_button(action_grid, "[A] CUE × 6", _play_current_six, CYAN)
	_add_action_button(action_grid, "[F] FULL 10 × 6", _play_full_matrix, GOLD)
	_add_action_button(action_grid, "[S] STOP", _stop_from_button, DANGER)
	_mute_button = _add_action_button(action_grid, "[M] SOUND ON", _toggle_mute, MUTED_TEXT)
	_add_action_button(action_grid, "[R] RESET", _reset_review, MUTED_TEXT)

	var output_row := HBoxContainer.new()
	output_row.add_theme_constant_override("separation", 10)
	review_column.add_child(output_row)

	_volume_label = Label.new()
	_volume_label.text = "OUTPUT  −9 dB"
	_volume_label.custom_minimum_size = Vector2(112.0, 36.0)
	_volume_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_volume_label.add_theme_color_override("font_color", MUTED_TEXT)
	output_row.add_child(_volume_label)

	var volume_slider := HSlider.new()
	volume_slider.min_value = -24.0
	volume_slider.max_value = 0.0
	volume_slider.step = 1.0
	volume_slider.value = Catalog.DEFAULT_OUTPUT_DB
	volume_slider.custom_minimum_size = Vector2(220.0, 36.0)
	volume_slider.value_changed.connect(_on_volume_changed)
	output_row.add_child(volume_slider)
	_synth.set_output_db(Catalog.DEFAULT_OUTPUT_DB)

	_metrics_label = Label.new()
	_metrics_label.text = "No render triggered yet. Start at conservative device volume."
	_metrics_label.add_theme_color_override("font_color", MUTED_TEXT)
	output_row.add_child(_metrics_label)

	_status_label = Label.new()
	_status_label.text = "READY — selection is silent; replay is one deterministic cue/variation"
	_status_label.add_theme_font_size_override("font_size", 16)
	_status_label.add_theme_color_override("font_color", TEXT)
	column.add_child(_status_label)

	var gap_note := Label.new()
	gap_note.text = "Automated review spacing: %.0f ms dry between variations • %.0f ms between cue families • Escape quits" % [
		Catalog.DRY_GAP_SECONDS * 1000.0,
		Catalog.FAMILY_GAP_SECONDS * 1000.0,
	]
	gap_note.add_theme_color_override("font_color", MUTED_TEXT)
	gap_note.add_theme_font_size_override("font_size", 13)
	column.add_child(gap_note)


func _add_action_button(parent: Control, label: String, callback: Callable, accent: Color) -> Button:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = Vector2(0.0, 39.0)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.add_theme_stylebox_override("normal", _button_style(PANEL, accent, 0.34))
	button.add_theme_stylebox_override("hover", _button_style(PANEL_HOVER, accent, 0.82))
	button.add_theme_stylebox_override("pressed", _button_style(Color("#173247"), accent, 1.0))
	button.pressed.connect(callback)
	parent.add_child(button)
	return button


func _button_style(fill: Color, border: Color, border_alpha: float) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = Color(border, border_alpha)
	style.set_border_width_all(2)
	style.set_corner_radius_all(6)
	style.content_margin_left = 12.0
	style.content_margin_right = 12.0
	return style


func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(PANEL, 0.92)
	style.border_color = Color(CYAN, 0.24)
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	style.content_margin_left = 14.0
	style.content_margin_right = 14.0
	style.content_margin_top = 10.0
	style.content_margin_bottom = 10.0
	return style


func _select_cue(cue_index_value: int, stop_active: bool) -> void:
	if stop_active:
		_cancel_active_review()
	_current_cue_index = clampi(cue_index_value, 0, Catalog.CUES.size() - 1)
	if not _cue_buttons.is_empty():
		_cue_buttons[_current_cue_index].set_pressed_no_signal(true)
	_update_selection_labels()


func _select_variation(variation_index: int, stop_active: bool) -> void:
	if stop_active:
		_cancel_active_review()
	_current_variation = clampi(variation_index, 0, Catalog.VARIATION_COUNT - 1)
	if not _variation_buttons.is_empty():
		_variation_buttons[_current_variation].set_pressed_no_signal(true)
	_update_selection_labels()


func _update_selection_labels() -> void:
	if _cue_name_label == null or _synth == null:
		return
	var definition := Catalog.definition(_current_cue_index)
	var cue_id := definition["id"] as StringName
	var metadata: Dictionary = _synth.cue_metadata(cue_id) as Dictionary
	var contacts: PackedFloat32Array = metadata.get("contacts", PackedFloat32Array())
	_cue_name_label.text = str(definition["name"])
	_variation_label.text = "DETERMINISTIC VARIATION %d / 6" % (_current_variation + 1)
	_detail_label.text = str(definition["prompt"])
	_avoid_label.text = str(definition["avoid"])
	var authored_marker := ""
	if metadata.has("beam_seconds"):
		authored_marker = " • narrow beam event 220 ms"
	elif metadata.has("lock_seconds"):
		authored_marker = " • containment lock 240 ms"
	_timing_label.text = "Render %.0f ms • semantic contact %s%s" % [
		float(metadata.get("duration_seconds", 0.0)) * 1000.0,
		_format_contacts(contacts),
		authored_marker,
	]
	queue_redraw()


func _replay_selected() -> void:
	_cancel_active_review()
	_trigger_selected("REPLAY")


func _trigger_selected(prefix: String) -> Dictionary:
	var definition := Catalog.definition(_current_cue_index)
	var cue_id := definition["id"] as StringName
	var metrics := ExactVariation.play(_synth, cue_id, _current_variation)
	if metrics.is_empty():
		_status_label.text = "FAILED — production synth did not render the selected review step"
		return metrics
	var metadata: Dictionary = _synth.cue_metadata(cue_id) as Dictionary
	_last_duration_seconds = float(metadata.get("duration_seconds", 0.0))
	_last_started_msec = Time.get_ticks_msec()
	_status_label.text = "%s — %s • variation %d / 6 • contact %s" % [
		prefix,
		definition["name"],
		_current_variation + 1,
		_format_contacts(metadata.get("contacts", PackedFloat32Array())),
	]
	if str(metrics.get("source", "procedural")) == "licensed":
		_metrics_label.text = "licensed WAV • %d layers • source variation %d / 3 • pitch %.3f" % [
			int(metrics.get("layer_count", 0)),
			int(metrics.get("licensed_variation_index", 0)) + 1,
			float(metrics.get("pitch_scale", 1.0)),
		]
	else:
		_metrics_label.text = "procedural render %d frames • peak %.4f • RMS %.4f" % [
			int(metrics.get("frames", 0)),
			float(metrics.get("peak", 0.0)),
			float(metrics.get("rms", 0.0)),
		]
	queue_redraw()
	return metrics


func _play_current_six() -> void:
	var definition := Catalog.definition(_current_cue_index)
	_start_plan(Catalog.single_cue_plan(_current_cue_index), "%s — ALL SIX" % definition["name"])


func _play_full_matrix() -> void:
	_start_plan(Catalog.full_matrix_plan(), "FULL TEN-CUE × SIX-VARIATION REVIEW")


func _start_plan(plan: Array[Dictionary], label: String) -> void:
	_cancel_active_review()
	_sequence_active = true
	_sequence_render_count = 0
	var token := _sequence_token
	_status_label.text = "STARTING — %s" % label
	_run_plan(plan, token, label)


func _run_plan(plan: Array[Dictionary], token: int, label: String) -> void:
	for plan_index in plan.size():
		if token != _sequence_token:
			return
		var item: Dictionary = plan[plan_index]
		_select_cue(int(item["cue_index"]), false)
		_select_variation(int(item["variation_index"]), false)
		var metrics := _trigger_selected("%s • %d / %d" % [label, plan_index + 1, plan.size()])
		if not metrics.is_empty():
			_sequence_render_count += 1
		var metadata: Dictionary = _synth.cue_metadata(
			Catalog.definition(_current_cue_index)["id"] as StringName
		) as Dictionary
		var wait_seconds := float(metadata["duration_seconds"]) + float(item["gap_seconds"])
		await get_tree().create_timer(wait_seconds).timeout
	if token != _sequence_token:
		return
	_sequence_active = false
	_status_label.text = "COMPLETE — %s • %d deterministic review steps" % [label, plan.size()]


func _cancel_active_review() -> void:
	_sequence_token += 1
	_sequence_active = false
	if _synth != null:
		_synth.stop()


func _stop_review(message: String) -> void:
	_cancel_active_review()
	_status_label.text = message


func _stop_from_button() -> void:
	_stop_review("STOPPED — queued playback and review sequence cleared")


func _reset_review() -> void:
	_cancel_active_review()
	_synth.reset_variation_sequence()
	_select_cue(0, false)
	_select_variation(0, false)
	_last_started_msec = 0
	_last_duration_seconds = 0.0
	_metrics_label.text = "No render triggered yet. Start at conservative device volume."
	_status_label.text = "RESET — Vibro-Blade variation 1 selected; playback stopped"


func _toggle_mute() -> void:
	var muted := bool(_synth.toggle_muted())
	_mute_button.text = "[M] SOUND OFF" if muted else "[M] SOUND ON"
	_status_label.text = "MUTED — playback continues silently" if muted else "SOUND ON — selection unchanged"


func _on_volume_changed(value: float) -> void:
	_synth.set_output_db(value)
	_volume_label.text = "OUTPUT  %d dB" % roundi(value)


func _format_contacts(contacts_value: Variant) -> String:
	var contacts: PackedFloat32Array = contacts_value
	var labels := PackedStringArray()
	for contact in contacts:
		labels.append("%d ms" % roundi(contact * 1000.0))
	return " / ".join(labels)


func _draw() -> void:
	var bounds := size
	for band in 24:
		var ratio := float(band) / 23.0
		var color := Color(0.006 + ratio * 0.013, 0.011 + ratio * 0.017, 0.024 + ratio * 0.029, 1.0)
		draw_rect(Rect2(0.0, ratio * bounds.y, bounds.x, bounds.y / 23.0 + 2.0), color)
	draw_circle(Vector2(bounds.x * 0.84, bounds.y * 0.23), 185.0, Color(0.08, 0.34, 0.40, 0.05))
	draw_circle(Vector2(bounds.x * 0.12, bounds.y * 0.73), 225.0, Color(0.35, 0.17, 0.05, 0.04))
	_draw_timeline(bounds)


func _draw_timeline(bounds: Vector2) -> void:
	if _synth == null:
		return
	var definition := Catalog.definition(_current_cue_index)
	if definition.is_empty():
		return
	var metadata: Dictionary = _synth.cue_metadata(definition["id"] as StringName) as Dictionary
	var duration_seconds := float(metadata.get("duration_seconds", 1.0))
	var contacts: PackedFloat32Array = metadata.get("contacts", PackedFloat32Array())
	var left := 58.0
	var right := bounds.x - 58.0
	var y := bounds.y - 57.0
	var font := ThemeDB.fallback_font
	draw_rect(Rect2(left - 10.0, y - 39.0, right - left + 20.0, 69.0), Color(0.003, 0.008, 0.017, 0.88))
	draw_line(Vector2(left, y), Vector2(right, y), Color(MUTED_TEXT, 0.42), 3.0)
	draw_string(font, Vector2(left, y - 16.0), "AUTHORED BUFFER TIMELINE — %s — variation %d / 6" % [definition["name"], _current_variation + 1], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, MUTED_TEXT)
	if metadata.has("beam_seconds"):
		var beam_x := lerpf(left, right, float(metadata["beam_seconds"]) / duration_seconds)
		draw_line(Vector2(beam_x, y - 8.0), Vector2(beam_x, y + 10.0), CYAN, 2.0)
		draw_string(font, Vector2(beam_x - 28.0, y + 26.0), "BEAM", HORIZONTAL_ALIGNMENT_CENTER, 56.0, 11, CYAN)
	if metadata.has("lock_seconds"):
		var lock_x := lerpf(left, right, float(metadata["lock_seconds"]) / duration_seconds)
		draw_string(font, Vector2(lock_x - 28.0, y - 4.0), "LOCK", HORIZONTAL_ALIGNMENT_CENTER, 56.0, 11, GREEN)
	for contact in contacts:
		var contact_x := lerpf(left, right, contact / duration_seconds)
		draw_line(Vector2(contact_x, y - 10.0), Vector2(contact_x, y + 12.0), GOLD, 3.0)
		draw_string(font, Vector2(contact_x - 30.0, y + 26.0), "%d ms" % roundi(contact * 1000.0), HORIZONTAL_ALIGNMENT_CENTER, 60.0, 11, GOLD)
	if _last_started_msec <= 0 or _last_duration_seconds <= 0.0:
		return
	var elapsed := float(Time.get_ticks_msec() - _last_started_msec) / 1000.0
	if elapsed > _last_duration_seconds:
		return
	var cursor_x := lerpf(left, right, clampf(elapsed / _last_duration_seconds, 0.0, 1.0))
	draw_line(Vector2(left, y), Vector2(cursor_x, y), GREEN, 4.0)
	draw_circle(Vector2(cursor_x, y), 5.0, GREEN)


func _run_headless_smoke() -> void:
	var result := Checks.run(_synth)
	var ui_ready := (
		_cue_buttons.size() == 10
		and _variation_buttons.size() == 6
		and _status_label != null
		and _metrics_label != null
	)
	var passed := bool(result["passed"]) and ui_ready
	if passed:
		Engine.time_scale = 25.0
		_start_plan(Catalog.full_matrix_plan(), "HEADLESS SCHEDULER PROBE")
		while _sequence_active:
			await get_tree().process_frame
		Engine.time_scale = 1.0
		passed = _sequence_render_count == 60
	if passed:
		print(
			"[Combat Audio Listening Harness] SCENE SMOKE PASS ui_cues=%d ui_variations=%d selected_renders=%d licensed=%d procedural=%d scheduled_steps=%d output_suppressed=true"
			% [
				_cue_buttons.size(),
				_variation_buttons.size(),
				int(result["selected_renders"]),
				int(result["licensed_selections"]),
				int(result["procedural_selections"]),
				_sequence_render_count,
			]
		)
	else:
		Engine.time_scale = 1.0
		push_error("[Combat Audio Listening Harness] SCENE SMOKE FAILED")
	_synth.shutdown()
	_synth.queue_free()
	_synth = null
	get_tree().quit(0 if passed else 1)
