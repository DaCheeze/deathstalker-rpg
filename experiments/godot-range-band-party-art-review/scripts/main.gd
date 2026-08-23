extends Node2D

const DESIGN_SIZE: Vector2 = Vector2(1920.0, 1080.0)
const MANIFEST_PATH: String = "res://study/party_review_manifest.json"
const VIEW_FORMATION: int = 0
const VIEW_COMPARISON: int = 1
const VIEW_MATTES: int = 2
const VIEW_DIAGNOSTIC: int = 3
const VIEW_MOTION: int = 4
const UI_WHITE: Color = Color("#f8fafc")
const UI_MUTED: Color = Color("#9aa8ba")
const UI_CYAN: Color = Color("#67e8f9")
const UI_GOLD: Color = Color("#f5c86a")
const UI_RED: Color = Color("#fb7185")
const UI_GREEN: Color = Color("#6ee7b7")

var manifest: Dictionary = {}
var asset_records: Array = []
var background_records: Array = []
var asset_images: Dictionary = {}
var asset_textures: Dictionary = {}
var asset_bounds: Dictionary = {}
var background_textures: Array[Texture2D] = []
var validation_errors: Array[String] = []
var review_blockers: Array[String] = []
var view_mode: int = VIEW_FORMATION
var active_branch: String = "a"
var active_role: String = "power"
var background_mode: int = 0
var height_index: int = 1
var show_overlays: bool = false
var validate_only: bool = false
var resolved_timeline_record: Dictionary = {}
var replay_document: Dictionary = {}
var replay_frames: Array = []
var replay_seconds: float = 0.0
var replay_duration_seconds: float = 1.0
var replay_playing: bool = true
var replay_speed: float = 1.0
var freeze_replay_seconds: float = -1.0


func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_apply_command_line_overrides()
	_load_manifest()
	if validation_errors.is_empty():
		_validate_manifest_semantics()
		_load_and_validate_assets()
		_load_and_validate_backgrounds()
		_load_and_validate_resolved_timeline()
	_report_validation()
	queue_redraw()
	if validate_only or not validation_errors.is_empty():
		call_deferred("_finish_validation_run")
	else:
		if freeze_replay_seconds >= 0.0:
			replay_seconds = clampf(freeze_replay_seconds, 0.0, replay_duration_seconds)
			replay_playing = false
		set_process(true)


func _process(delta: float) -> void:
	if view_mode != VIEW_MOTION or not replay_playing or replay_frames.is_empty():
		return
	replay_seconds = fposmod(replay_seconds + delta * replay_speed, replay_duration_seconds)
	queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	if not (event is InputEventKey):
		return
	var key_event: InputEventKey = event as InputEventKey
	if not key_event.pressed or key_event.echo:
		return
	var handled: bool = true
	match key_event.keycode:
		KEY_1, KEY_F1:
			view_mode = VIEW_FORMATION
		KEY_2, KEY_F2:
			view_mode = VIEW_COMPARISON
		KEY_3, KEY_F3:
			view_mode = VIEW_MATTES
		KEY_4, KEY_F4:
			view_mode = VIEW_DIAGNOSTIC
		KEY_5, KEY_F5:
			view_mode = VIEW_MOTION
		KEY_SPACE:
			replay_playing = not replay_playing
		KEY_LEFT:
			replay_playing = false
			replay_seconds = fposmod(replay_seconds - 0.10, replay_duration_seconds)
		KEY_RIGHT:
			replay_playing = false
			replay_seconds = fposmod(replay_seconds + 0.10, replay_duration_seconds)
		KEY_PAGEUP:
			replay_playing = false
			_jump_replay_frame(-1)
		KEY_PAGEDOWN:
			replay_playing = false
			_jump_replay_frame(1)
		KEY_S:
			replay_speed = 0.25 if replay_speed > 0.25 else 1.0
		KEY_HOME:
			replay_seconds = 0.0
			replay_playing = false
		KEY_A:
			active_branch = "a"
		KEY_B:
			active_branch = "b"
		KEY_C, KEY_TAB:
			active_branch = "b" if active_branch == "a" else "a"
		KEY_Q:
			active_role = "power"
		KEY_W:
			active_role = "critical"
		KEY_E:
			active_role = "queue"
		KEY_G:
			background_mode = (background_mode + 1) % 3
		KEY_O:
			show_overlays = not show_overlays
		KEY_Z:
			height_index = (height_index + 1) % 3
		KEY_R:
			view_mode = VIEW_FORMATION
			active_branch = "a"
			active_role = "power"
			background_mode = 0
			height_index = 1
			show_overlays = false
			replay_seconds = 0.0
			replay_playing = false
			replay_speed = 1.0
		KEY_ESCAPE:
			get_tree().quit()
		_:
			handled = false
	if handled:
		queue_redraw()
		get_viewport().set_input_as_handled()


func _draw() -> void:
	if not validation_errors.is_empty() or asset_textures.size() != 6:
		_draw_load_failure()
		return
	_draw_environment()
	match view_mode:
		VIEW_FORMATION:
			_draw_formation(active_branch)
		VIEW_COMPARISON:
			_draw_comparison()
		VIEW_MATTES:
			_draw_mattes()
		VIEW_DIAGNOSTIC:
			_draw_diagnostic_grid()
		VIEW_MOTION:
			_draw_motion_rehearsal()
	_draw_header()
	_draw_footer()


func _apply_command_line_overrides() -> void:
	for argument: String in OS.get_cmdline_user_args():
		if argument == "--validate-only":
			validate_only = true
		elif argument == "--paused":
			replay_playing = false
		elif argument.begins_with("--time="):
			freeze_replay_seconds = argument.trim_prefix("--time=").to_float()
			if freeze_replay_seconds < 0.0:
				_add_error("--time must be nonnegative.")
		elif argument.begins_with("--speed="):
			replay_speed = argument.trim_prefix("--speed=").to_float()
			if replay_speed <= 0.0:
				_add_error("--speed must be positive.")
		elif argument == "--overlays=off":
			show_overlays = false
		elif argument == "--overlays=on":
			show_overlays = true
		elif argument.begins_with("--view="):
			var view_value: String = argument.trim_prefix("--view=").to_lower()
			var views: Dictionary = {"formation": VIEW_FORMATION, "compare": VIEW_COMPARISON, "mattes": VIEW_MATTES, "diagnostic": VIEW_DIAGNOSTIC, "motion": VIEW_MOTION}
			if views.has(view_value):
				view_mode = int(views[view_value])
			else:
				_add_error("Unknown --view value: %s" % view_value)
		elif argument.begins_with("--branch="):
			var branch_value: String = argument.trim_prefix("--branch=").to_lower()
			if branch_value == "a" or branch_value == "b":
				active_branch = branch_value
			else:
				_add_error("--branch must be a or b.")
		elif argument.begins_with("--role="):
			var role_value: String = argument.trim_prefix("--role=").to_lower()
			if role_value in ["power", "critical", "queue"]:
				active_role = role_value
			else:
				_add_error("--role must be power, critical, or queue.")
		elif argument.begins_with("--height="):
			var height_value: int = argument.trim_prefix("--height=").to_int()
			if height_value == 320:
				height_index = 0
			elif height_value == 360:
				height_index = 1
			elif height_value == 400:
				height_index = 2
			else:
				_add_error("--height must be 320, 360, or 400.")
		elif argument.begins_with("--background="):
			var background_value: String = argument.trim_prefix("--background=").to_lower()
			if background_value == "neutral":
				background_mode = 0
			elif background_value == "empire-a":
				background_mode = 1
			elif background_value == "empire-b":
				background_mode = 2
			else:
				_add_error("--background must be neutral, empire-a, or empire-b.")


func _load_manifest() -> void:
	var file: FileAccess = FileAccess.open(MANIFEST_PATH, FileAccess.READ)
	if file == null:
		_add_error("Missing review manifest: %s" % MANIFEST_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		_add_error("Review manifest must be a JSON object.")
		return
	manifest = parsed as Dictionary
	var assets_value: Variant = manifest.get("assets", [])
	var backgrounds_value: Variant = manifest.get("backgrounds", [])
	var timeline_value: Variant = manifest.get("resolvedTimeline", {})
	if not (assets_value is Array) or not (backgrounds_value is Array) or not (timeline_value is Dictionary):
		_add_error("Manifest assets/backgrounds must be arrays and resolvedTimeline must be an object.")
		return
	asset_records = assets_value as Array
	background_records = backgrounds_value as Array
	resolved_timeline_record = timeline_value as Dictionary


func _validate_manifest_semantics() -> void:
	if str(manifest.get("format", "")) != "godot-range-band-party-art-review" or int(manifest.get("version", 0)) != 1:
		_add_error("Unsupported review manifest format/version.")
	if str(manifest.get("approvalState", "")) != "unapproved":
		_add_error("Review assets must remain explicitly unapproved.")
	if str(manifest.get("runtimeRegistration", "")) != "none":
		_add_error("Review assets must not claim runtime registration.")
	if str(manifest.get("scope", "")) != "six-idle-keyframe-party-choice-comparison-visual-qa-only":
		_add_error("Review scope must remain the bounded six-keyframe comparison.")
	if asset_records.size() != 6:
		_add_error("Review requires exactly six combatant studies.")
	var seen_ids: Dictionary = {}
	for branch: String in ["a", "b"]:
		for role: String in ["power", "critical", "queue"]:
			seen_ids["%s-%s" % [role, branch]] = false
	for raw_record: Variant in asset_records:
		if not (raw_record is Dictionary):
			_add_error("Every combatant record must be an object.")
			continue
		var record: Dictionary = raw_record as Dictionary
		var study_id: String = str(record.get("studyId", ""))
		var branch: String = str(record.get("branch", ""))
		var role: String = str(record.get("roleId", ""))
		if study_id != "%s-%s" % [role, branch] or not seen_ids.has(study_id):
			_add_error("Unexpected study identity: %s" % study_id)
		elif bool(seen_ids[study_id]):
			_add_error("Duplicate study identity: %s" % study_id)
		else:
			seen_ids[study_id] = true
	if background_records.size() != 2:
		_add_error("Review requires exactly two optional unapproved Empire backgrounds.")
	_add_blocker("All six inputs are single idle-like keyframes, not animation packages.")
	_add_blocker("Ground anchors and 320/360/400 px heights are review proposals, not approvals.")
	_add_blocker("The environment toggle is contextual only and does not select an Empire background.")
	_add_blocker("No study is registered with the canonical Godot client.")


func _load_and_validate_assets() -> void:
	for raw_record: Variant in asset_records:
		if not (raw_record is Dictionary):
			continue
		var record: Dictionary = raw_record as Dictionary
		var study_id: String = str(record.get("studyId", "unknown"))
		var source_path: String = _resolve_repo_path(str(record.get("repoRelativeSource", "")), study_id)
		if source_path.is_empty():
			continue
		_validate_file_identity(source_path, record, study_id)
		_validate_png_header(FileAccess.get_file_as_bytes(source_path), study_id)
		var image: Image = Image.new()
		var load_result: Error = image.load(source_path)
		if load_result != OK:
			_add_error("Could not decode %s: error %d" % [study_id, load_result])
			continue
		var expected_dimensions: Vector2i = _array_to_vector2i(record.get("expectedDimensions", []))
		if Vector2i(image.get_width(), image.get_height()) != expected_dimensions:
			_add_error("%s decoded dimensions changed." % study_id)
		if image.get_format() != Image.FORMAT_RGBA8:
			_add_error("%s must decode as RGBA8." % study_id)
		var scan: Dictionary = _scan_alpha(image)
		var expected_bounds: Rect2i = _array_to_rect2i(record.get("expectedAlphaBounds", []))
		if scan.get("bounds", Rect2i()) as Rect2i != expected_bounds:
			_add_error("%s alpha bounds changed: expected %s, got %s." % [study_id, expected_bounds, scan.get("bounds", Rect2i())])
		if int(scan.get("transparent", 0)) <= 0 or int(scan.get("partial", 0)) <= 0:
			_add_error("%s must retain transparent and partially transparent pixels." % study_id)
		if int(scan.get("edge_nonzero", 0)) != 0:
			_add_error("%s has nonzero alpha touching a source edge." % study_id)
		asset_images[study_id] = image
		asset_textures[study_id] = ImageTexture.create_from_image(image)
		asset_bounds[study_id] = scan.get("bounds", Rect2i())


func _load_and_validate_backgrounds() -> void:
	for background_index: int in range(background_records.size()):
		var raw_record: Variant = background_records[background_index]
		if not (raw_record is Dictionary):
			_add_error("Background %d record must be an object." % background_index)
			continue
		var record: Dictionary = raw_record as Dictionary
		var source_path: String = _resolve_repo_path(str(record.get("repoRelativeSource", "")), "background %d" % background_index)
		if source_path.is_empty():
			continue
		_validate_file_identity(source_path, record, "background %d" % background_index)
		var image: Image = Image.new()
		var load_result: Error = image.load(source_path)
		if load_result != OK:
			_add_error("Could not decode background %d: error %d" % [background_index, load_result])
			continue
		if Vector2i(image.get_width(), image.get_height()) != _array_to_vector2i(record.get("expectedDimensions", [])):
			_add_error("Background %d decoded dimensions changed." % background_index)
		background_textures.append(ImageTexture.create_from_image(image))


func _load_and_validate_resolved_timeline() -> void:
	var relative_path: String = str(resolved_timeline_record.get("repoRelativeSource", ""))
	if relative_path.is_empty() or relative_path.is_absolute_path() or relative_path.contains("..") or not relative_path.begins_with("godot/data/"):
		_add_error("Resolved timeline has an unsafe repository-relative source path.")
		return
	var experiment_root: String = ProjectSettings.globalize_path("res://").simplify_path()
	var repository_root: String = experiment_root.path_join("../..").simplify_path()
	var source_path: String = repository_root.path_join(relative_path).simplify_path()
	if not source_path.begins_with(repository_root + "/") and not source_path.begins_with(repository_root + "\\"):
		_add_error("Resolved timeline escaped the repository root.")
		return
	if not FileAccess.file_exists(source_path):
		_add_error("Missing resolved presentation timeline: %s" % relative_path)
		return
	_validate_file_identity(source_path, resolved_timeline_record, "resolved range-band timeline")
	var file: FileAccess = FileAccess.open(source_path, FileAccess.READ)
	if file == null:
		_add_error("Could not open resolved presentation timeline.")
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not (parsed is Dictionary):
		_add_error("Resolved presentation timeline must be a JSON object.")
		return
	replay_document = parsed as Dictionary
	if str(replay_document.get("format", "")) != str(resolved_timeline_record.get("expectedFormat", "")):
		_add_error("Resolved presentation format changed.")
	if int(replay_document.get("schemaVersion", 0)) != int(resolved_timeline_record.get("expectedSchemaVersion", 0)):
		_add_error("Resolved presentation schema version changed.")
	var source: Dictionary = replay_document.get("source", {}) as Dictionary
	if str(source.get("fixtureId", "")) != str(resolved_timeline_record.get("expectedFixtureId", "")):
		_add_error("Resolved presentation fixture identity changed.")
	var timing: Dictionary = replay_document.get("timing", {}) as Dictionary
	replay_duration_seconds = float(timing.get("durationSeconds", 0.0))
	if not is_equal_approx(replay_duration_seconds, float(resolved_timeline_record.get("expectedDurationSeconds", -1.0))):
		_add_error("Resolved presentation duration changed.")
	var frames_value: Variant = replay_document.get("frames", [])
	if not (frames_value is Array):
		_add_error("Resolved presentation frames must be an array.")
		return
	replay_frames = frames_value as Array
	if replay_frames.size() != int(resolved_timeline_record.get("expectedFrameCount", 0)):
		_add_error("Resolved presentation frame count changed.")
	_validate_resolved_frame_contract()
	_add_blocker("Motion view uses restrained whole-raster transforms over one static keyframe; it is not authored animation coverage or a motion-pipeline selection.")


func _validate_resolved_frame_contract() -> void:
	var expected_ids: Array[String] = [
		"prototype_power",
		"prototype_duelist",
		"prototype_control",
		"prototype_opponent_a",
		"prototype_opponent_b",
		"prototype_opponent_c",
	]
	var allowed_actions: Array[String] = ["advance", "attack", "disruptor"]
	for frame_index: int in range(replay_frames.size()):
		var raw_frame: Variant = replay_frames[frame_index]
		if not (raw_frame is Dictionary):
			_add_error("Resolved frame %d must be an object." % frame_index)
			continue
		var frame: Dictionary = raw_frame as Dictionary
		if int(frame.get("index", -1)) != frame_index:
			_add_error("Resolved frame index changed at %d." % frame_index)
		var state_value: Variant = frame.get("state", {})
		if not (state_value is Dictionary):
			_add_error("Resolved frame %d state must be an object." % frame_index)
			continue
		var state: Dictionary = state_value as Dictionary
		var combatants_value: Variant = state.get("combatants", [])
		if not (combatants_value is Array) or (combatants_value as Array).size() != expected_ids.size():
			_add_error("Resolved frame %d must retain six combatants." % frame_index)
			continue
		var combatants: Array = combatants_value as Array
		for combatant_index: int in range(expected_ids.size()):
			if not (combatants[combatant_index] is Dictionary) or str((combatants[combatant_index] as Dictionary).get("id", "")) != expected_ids[combatant_index]:
				_add_error("Resolved frame %d combatant IDs/order changed." % frame_index)
				break
		var action_value: Variant = frame.get("action")
		if frame_index == 0:
			if action_value != null:
				_add_error("Resolved initial frame action must remain null.")
		elif not (action_value is Dictionary):
			_add_error("Resolved transition frame %d requires an action." % frame_index)
		else:
			var action: Dictionary = action_value as Dictionary
			if str(action.get("type", "")) not in allowed_actions:
				_add_error("Resolved frame %d contains an unexpected action type." % frame_index)
			if str(action.get("actorId", "")) not in expected_ids:
				_add_error("Resolved frame %d action actor changed." % frame_index)


func _jump_replay_frame(offset: int) -> void:
	if replay_frames.is_empty():
		return
	var current_index: int = _current_replay_frame_index()
	var next_index: int = wrapi(current_index + offset, 0, replay_frames.size())
	var next_frame: Dictionary = replay_frames[next_index] as Dictionary
	replay_seconds = float(next_frame.get("atSeconds", 0.0))


func _current_replay_frame_index() -> int:
	var current_index: int = 0
	for frame_index: int in range(replay_frames.size()):
		var frame: Dictionary = replay_frames[frame_index] as Dictionary
		if replay_seconds >= float(frame.get("atSeconds", 0.0)):
			current_index = frame_index
		else:
			break
	return current_index


func _replay_action_progress(frame: Dictionary) -> float:
	if frame.get("action") == null:
		return 1.0
	var action: Dictionary = frame.get("action", {}) as Dictionary
	var timing: Dictionary = action.get("timing", {}) as Dictionary
	var duration: float = float(timing.get("durationSeconds", 0.3))
	return clampf(_replay_action_elapsed(frame) / maxf(duration, 0.001), 0.0, 1.0)


func _replay_action_elapsed(frame: Dictionary) -> float:
	return maxf(0.0, replay_seconds - float(frame.get("atSeconds", 0.0)))


func _replay_action_result_anchor(action: Dictionary) -> float:
	var timing: Dictionary = action.get("timing", {}) as Dictionary
	var contact_value: Variant = timing.get("visualContactSeconds")
	return float(contact_value) if contact_value != null else float(timing.get("durationSeconds", 0.3))


func _visible_replay_state(frame_index: int, frame: Dictionary, action: Dictionary, elapsed: float) -> Dictionary:
	var result_state: Dictionary = frame.get("state", {}) as Dictionary
	if frame_index == 0 or action.is_empty() or elapsed >= _replay_action_result_anchor(action):
		return result_state
	var previous_frame: Dictionary = replay_frames[frame_index - 1] as Dictionary
	return previous_frame.get("state", {}) as Dictionary


func _draw_motion_rehearsal() -> void:
	if replay_frames.is_empty():
		return
	var frame_index: int = _current_replay_frame_index()
	var frame: Dictionary = replay_frames[frame_index] as Dictionary
	var action: Dictionary = {}
	if frame.get("action") is Dictionary:
		action = frame.get("action", {}) as Dictionary
	var elapsed: float = _replay_action_elapsed(frame)
	var progress: float = _replay_action_progress(frame)
	var visible_state: Dictionary = _visible_replay_state(frame_index, frame, action, elapsed)
	var left_panel: Rect2 = Rect2(38.0, 126.0, 892.0, 830.0)
	var right_panel: Rect2 = Rect2(990.0, 126.0, 892.0, 830.0)
	_draw_motion_branch("a", left_panel, frame_index, frame, visible_state, action, elapsed, progress)
	_draw_motion_branch("b", right_panel, frame_index, frame, visible_state, action, elapsed, progress)
	_draw_motion_timeline(frame_index, action)


func _draw_motion_branch(
	branch: String,
	panel: Rect2,
	frame_index: int,
	frame: Dictionary,
	visible_state: Dictionary,
	action: Dictionary,
	elapsed: float,
	progress: float
) -> void:
	var accent: Color = UI_CYAN if branch == "a" else UI_GOLD
	draw_rect(panel, Color(0.004, 0.011, 0.023, 0.62))
	draw_rect(panel, Color(accent, 0.42), false, 2.0)
	draw_string(ThemeDB.fallback_font, panel.position + Vector2(24.0, 38.0), "CHOICE %s • IDENTICAL RESOLVED TIMELINE" % branch.to_upper(), HORIZONTAL_ALIGNMENT_LEFT, panel.size.x - 48.0, 17, accent)
	draw_string(ThemeDB.fallback_font, panel.position + Vector2(24.0, 64.0), "Restrained whole-raster rehearsal • one source keyframe • unapproved", HORIZONTAL_ALIGNMENT_LEFT, panel.size.x - 48.0, 11, UI_MUTED)

	var combatants: Array = visible_state.get("combatants", []) as Array
	for raw_combatant: Variant in combatants:
		if not (raw_combatant is Dictionary):
			continue
		var combatant: Dictionary = raw_combatant as Dictionary
		var range_state: Dictionary = combatant.get("range", {}) as Dictionary
		var target_id: String = str(range_state.get("targetId", ""))
		if str(combatant.get("side", "")) == "party" and not target_id.is_empty():
			var target: Dictionary = _combatant_in_state(visible_state, target_id)
			if not target.is_empty():
				var from_position: Vector2 = _motion_position_for(panel, combatant, frame_index, frame, visible_state, action, progress)
				var to_position: Vector2 = _motion_position_for(panel, target, frame_index, frame, visible_state, action, progress)
				draw_line(from_position, to_position, Color(accent, 0.10), 1.0)

	_draw_motion_action_trace(panel, frame_index, frame, visible_state, action, elapsed, progress, accent)

	for raw_combatant: Variant in combatants:
		if not (raw_combatant is Dictionary):
			continue
		var combatant: Dictionary = raw_combatant as Dictionary
		if str(combatant.get("side", "")) != "enemy":
			continue
		var marker_position: Vector2 = _motion_position_for(panel, combatant, frame_index, frame, visible_state, action, progress)
		_draw_motion_opponent_marker(combatant, marker_position, action, progress)

	for raw_combatant: Variant in combatants:
		if not (raw_combatant is Dictionary):
			continue
		var combatant: Dictionary = raw_combatant as Dictionary
		if str(combatant.get("side", "")) != "party":
			continue
		var combatant_id: String = str(combatant.get("id", ""))
		var role: String = _study_role_for_combatant(combatant_id)
		if role.is_empty():
			continue
		var ground_position: Vector2 = _motion_position_for(panel, combatant, frame_index, frame, visible_state, action, progress)
		var pose: Dictionary = _motion_pose_for(combatant, action, elapsed, progress)
		_draw_ground(ground_position, 76.0)
		draw_set_transform(ground_position, float(pose.get("rotation", 0.0)), pose.get("scale", Vector2.ONE) as Vector2)
		_draw_combatant("%s-%s" % [role, branch], Vector2.ZERO, 238.0, show_overlays)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		_draw_motion_party_status(panel, combatant, ground_position, role, accent)


func _draw_motion_timeline(frame_index: int, action: Dictionary) -> void:
	var timeline_rect: Rect2 = Rect2(354.0, 970.0, 1212.0, 22.0)
	draw_rect(timeline_rect, Color(0.003, 0.008, 0.020, 0.92))
	var timeline_width: float = timeline_rect.size.x * clampf(replay_seconds / replay_duration_seconds, 0.0, 1.0)
	draw_rect(Rect2(timeline_rect.position, Vector2(timeline_width, timeline_rect.size.y)), Color(UI_CYAN, 0.64))
	draw_rect(timeline_rect, Color(UI_WHITE, 0.30), false, 1.0)
	var action_label: String = "INITIAL FORMATION"
	if not action.is_empty():
		var ability_name_value: Variant = action.get("abilityName")
		action_label = str(ability_name_value) if ability_name_value != null else ""
		if action_label.is_empty():
			action_label = str(action.get("type", "ACTION")).to_upper()
	draw_string(ThemeDB.fallback_font, Vector2(38.0, 987.0), "%02d / %02d" % [frame_index, replay_frames.size() - 1], HORIZONTAL_ALIGNMENT_LEFT, 250.0, 12, UI_WHITE)
	draw_string(ThemeDB.fallback_font, Vector2(1600.0, 987.0), "%05.2f / %05.2f s" % [replay_seconds, replay_duration_seconds], HORIZONTAL_ALIGNMENT_RIGHT, 282.0, 12, UI_WHITE)
	draw_string(ThemeDB.fallback_font, Vector2(560.0, 987.0), action_label, HORIZONTAL_ALIGNMENT_CENTER, 800.0, 12, UI_GOLD)


func _draw_motion_action_trace(
	panel: Rect2,
	frame_index: int,
	frame: Dictionary,
	visible_state: Dictionary,
	action: Dictionary,
	elapsed: float,
	progress: float,
	accent: Color
) -> void:
	if action.is_empty():
		return
	var actor: Dictionary = _combatant_in_state(visible_state, str(action.get("actorId", "")))
	var target: Dictionary = _combatant_in_state(visible_state, str(action.get("targetId", "")))
	if actor.is_empty() or target.is_empty():
		return
	var actor_position: Vector2 = _motion_position_for(panel, actor, frame_index, frame, visible_state, action, progress)
	var target_position: Vector2 = _motion_position_for(panel, target, frame_index, frame, visible_state, action, progress)
	var action_type: String = str(action.get("type", ""))
	if action_type == "disruptor":
		var timing: Dictionary = action.get("timing", {}) as Dictionary
		var beam_start: float = float(timing.get("beamStartSeconds", 0.18))
		var contact: float = float(timing.get("visualContactSeconds", 0.46))
		if elapsed >= beam_start and elapsed <= float(timing.get("durationSeconds", 0.54)):
			var beam_alpha: float = 0.72 if elapsed <= contact else 0.34
			draw_line(actor_position + Vector2(0.0, -84.0), target_position + Vector2(0.0, -84.0), Color(accent, beam_alpha), 5.0)
			draw_line(actor_position + Vector2(0.0, -84.0), target_position + Vector2(0.0, -84.0), Color(UI_WHITE, beam_alpha * 0.72), 1.5)
	elif action_type == "attack" and str(action.get("abilityCategory", "")) == "melee":
		draw_line(actor_position, target_position, Color(accent, 0.06 + 0.10 * sin(progress * PI)), 2.0)


func _motion_position_for(
	panel: Rect2,
	combatant: Dictionary,
	frame_index: int,
	frame: Dictionary,
	visible_state: Dictionary,
	action: Dictionary,
	progress: float
) -> Vector2:
	var combatant_id: String = str(combatant.get("id", ""))
	var position: Vector2 = _base_motion_position(panel, combatant)
	if action.is_empty():
		return position
	var actor_id: String = str(action.get("actorId", ""))
	var target_id: String = str(action.get("targetId", ""))
	var action_type: String = str(action.get("type", ""))
	if action_type == "advance" and actor_id == combatant_id and frame_index > 0:
		var previous_frame: Dictionary = replay_frames[frame_index - 1] as Dictionary
		var previous_state: Dictionary = previous_frame.get("state", {}) as Dictionary
		var previous_combatant: Dictionary = _combatant_in_state(previous_state, combatant_id)
		var result_state: Dictionary = frame.get("state", {}) as Dictionary
		var result_combatant: Dictionary = _combatant_in_state(result_state, combatant_id)
		if not previous_combatant.is_empty() and not result_combatant.is_empty():
			var eased_progress: float = progress * progress * (3.0 - 2.0 * progress)
			return _base_motion_position(panel, previous_combatant).lerp(_base_motion_position(panel, result_combatant), eased_progress)
	if actor_id == combatant_id and action_type == "attack" and str(action.get("abilityCategory", "")) == "melee":
		var target: Dictionary = _combatant_in_state(visible_state, target_id)
		if not target.is_empty():
			var target_position: Vector2 = _base_motion_position(panel, target)
			return position + position.direction_to(target_position) * sin(progress * PI) * 56.0
	return position


func _base_motion_position(panel: Rect2, combatant: Dictionary) -> Vector2:
	var side: String = str(combatant.get("side", "enemy"))
	var slot: int = int(combatant.get("slot", 0))
	var range_state: Dictionary = combatant.get("range", {}) as Dictionary
	var band: String = str(range_state.get("band", "ranged"))
	var distance_from_center: float = 330.0
	if band == "closing":
		distance_from_center = 225.0
	elif band == "engaged":
		distance_from_center = 72.0
	var center_x: float = panel.position.x + panel.size.x * 0.5
	var x: float = center_x + distance_from_center if side == "party" else center_x - distance_from_center
	var y: float = panel.position.y + 272.0 + float(slot) * 222.0
	return Vector2(x, y)


func _motion_pose_for(combatant: Dictionary, action: Dictionary, elapsed: float, progress: float) -> Dictionary:
	var combatant_id: String = str(combatant.get("id", ""))
	var slot: int = int(combatant.get("slot", 0))
	var breath: float = sin(replay_seconds * TAU * 0.72 + float(slot) * 1.9) * 0.006
	var pose_scale: Vector2 = Vector2(1.0 - breath * 0.35, 1.0 + breath)
	var rotation: float = 0.0
	if not action.is_empty():
		var actor_id: String = str(action.get("actorId", ""))
		var target_id: String = str(action.get("targetId", ""))
		var action_type: String = str(action.get("type", ""))
		if actor_id == combatant_id:
			if action_type == "attack":
				rotation = -0.024 * sin(progress * PI)
				pose_scale *= Vector2(1.0 + 0.018 * sin(progress * PI), 1.0 - 0.012 * sin(progress * PI))
			elif action_type == "disruptor":
				rotation = -0.012 * sin(progress * PI)
		if target_id == combatant_id:
			var contact: float = _replay_action_result_anchor(action)
			var timing: Dictionary = action.get("timing", {}) as Dictionary
			var duration: float = float(timing.get("durationSeconds", 0.3))
			if elapsed >= contact:
				var reaction_progress: float = clampf((elapsed - contact) / maxf(duration - contact, 0.001), 0.0, 1.0)
				rotation = 0.032 * sin(reaction_progress * PI)
				pose_scale *= Vector2(1.0 + 0.012 * sin(reaction_progress * PI), 1.0 - 0.018 * sin(reaction_progress * PI))
	return {"rotation": rotation, "scale": pose_scale}


func _draw_motion_opponent_marker(combatant: Dictionary, position: Vector2, action: Dictionary, progress: float) -> void:
	var alive: bool = bool(combatant.get("alive", true))
	var marker_color: Color = Color("#ef4444") if alive else Color("#475569")
	var is_actor: bool = str(action.get("actorId", "")) == str(combatant.get("id", ""))
	var pulse: float = 1.0 + (0.08 * sin(progress * PI) if is_actor else 0.0)
	draw_circle(position + Vector2(0.0, -78.0), 34.0 * pulse, Color(marker_color, 0.18))
	draw_rect(Rect2(position + Vector2(-20.0, -116.0), Vector2(40.0, 92.0)), Color(marker_color, 0.42))
	draw_rect(Rect2(position + Vector2(-20.0, -116.0), Vector2(40.0, 92.0)), Color(marker_color, 0.86), false, 2.0)
	if not alive:
		draw_line(position + Vector2(-28.0, -108.0), position + Vector2(28.0, -40.0), UI_MUTED, 4.0)
		draw_line(position + Vector2(28.0, -108.0), position + Vector2(-28.0, -40.0), UI_MUTED, 4.0)
	var label: String = "OPP %s" % String.chr(65 + int(combatant.get("slot", 0)))
	draw_string(ThemeDB.fallback_font, position + Vector2(-54.0, 20.0), label, HORIZONTAL_ALIGNMENT_CENTER, 108.0, 11, marker_color)
	_draw_motion_hp_bar(position + Vector2(-48.0, 30.0), 96.0, combatant, marker_color)


func _draw_motion_party_status(panel: Rect2, combatant: Dictionary, position: Vector2, role: String, accent: Color) -> void:
	var label_position: Vector2 = position + Vector2(-88.0, 28.0)
	var range_state: Dictionary = combatant.get("range", {}) as Dictionary
	if str(range_state.get("band", "ranged")) == "engaged":
		label_position.x = panel.position.x + panel.size.x - 202.0
	draw_string(ThemeDB.fallback_font, label_position, _role_label(role), HORIZONTAL_ALIGNMENT_CENTER, 176.0, 10, UI_WHITE)
	_draw_motion_hp_bar(label_position + Vector2(14.0, 14.0), 148.0, combatant, accent)
	draw_string(ThemeDB.fallback_font, label_position + Vector2(0.0, 37.0), str(range_state.get("band", "ranged")).to_upper(), HORIZONTAL_ALIGNMENT_CENTER, 176.0, 10, UI_MUTED)


func _draw_motion_hp_bar(position: Vector2, width: float, combatant: Dictionary, color: Color) -> void:
	var max_hp: float = maxf(float(combatant.get("maxHp", 1)), 1.0)
	var hp_ratio: float = clampf(float(combatant.get("hp", 0)) / max_hp, 0.0, 1.0)
	draw_rect(Rect2(position, Vector2(width, 5.0)), Color(0.0, 0.0, 0.0, 0.62))
	draw_rect(Rect2(position, Vector2(width * hp_ratio, 5.0)), Color(color, 0.82))


func _combatant_in_state(state: Dictionary, combatant_id: String) -> Dictionary:
	for raw_combatant: Variant in state.get("combatants", []) as Array:
		if raw_combatant is Dictionary:
			var combatant: Dictionary = raw_combatant as Dictionary
			if str(combatant.get("id", "")) == combatant_id:
				return combatant
	return {}


func _study_role_for_combatant(combatant_id: String) -> String:
	if combatant_id == "prototype_power":
		return "power"
	if combatant_id == "prototype_duelist":
		return "critical"
	if combatant_id == "prototype_control":
		return "queue"
	return ""


func _resolve_repo_path(relative_path: String, label: String) -> String:
	if relative_path.is_empty() or relative_path.is_absolute_path() or relative_path.contains("..") or not relative_path.begins_with("art/"):
		_add_error("%s has an unsafe repository-relative source path." % label)
		return ""
	var experiment_root: String = ProjectSettings.globalize_path("res://").simplify_path()
	var repository_root: String = experiment_root.path_join("../..").simplify_path()
	var resolved: String = repository_root.path_join(relative_path).simplify_path()
	if not resolved.begins_with(repository_root + "/") and not resolved.begins_with(repository_root + "\\"):
		_add_error("%s resolved outside the repository." % label)
		return ""
	if not FileAccess.file_exists(resolved):
		_add_error("Missing source for %s: %s" % [label, relative_path])
		return ""
	return resolved


func _validate_file_identity(path: String, record: Dictionary, label: String) -> void:
	var expected_hash: String = str(record.get("expectedSha256", "")).to_upper()
	var actual_hash: String = _sha256_file(path)
	if actual_hash != expected_hash:
		_add_error("%s SHA-256 mismatch: expected %s, got %s" % [label, expected_hash, actual_hash])
	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		_add_error("Could not open %s for size validation." % label)
		return
	if file.get_length() != int(record.get("expectedBytes", -1)):
		_add_error("%s byte length changed." % label)


func _validate_png_header(bytes: PackedByteArray, label: String) -> void:
	var signature: Array[int] = [137, 80, 78, 71, 13, 10, 26, 10]
	if bytes.size() < 29:
		_add_error("%s is too short to be a PNG." % label)
		return
	for byte_index: int in range(signature.size()):
		if int(bytes[byte_index]) != signature[byte_index]:
			_add_error("%s has an invalid PNG signature." % label)
			return
	if int(bytes[24]) != 8 or int(bytes[25]) != 6 or int(bytes[28]) != 0:
		_add_error("%s must remain non-interlaced 8-bit RGBA PNG." % label)


func _scan_alpha(image: Image) -> Dictionary:
	var width: int = image.get_width()
	var height: int = image.get_height()
	var min_point: Vector2i = Vector2i(width, height)
	var max_point: Vector2i = Vector2i(-1, -1)
	var transparent: int = 0
	var partial: int = 0
	var edge_nonzero: int = 0
	for y: int in range(height):
		for x: int in range(width):
			var alpha: int = roundi(image.get_pixel(x, y).a * 255.0)
			if alpha == 0:
				transparent += 1
			elif alpha < 255:
				partial += 1
			if alpha > 0:
				min_point.x = mini(min_point.x, x)
				min_point.y = mini(min_point.y, y)
				max_point.x = maxi(max_point.x, x)
				max_point.y = maxi(max_point.y, y)
				if x == 0 or y == 0 or x == width - 1 or y == height - 1:
					edge_nonzero += 1
	var bounds: Rect2i = Rect2i(min_point, max_point - min_point + Vector2i.ONE)
	return {"bounds": bounds, "transparent": transparent, "partial": partial, "edge_nonzero": edge_nonzero}


func _draw_environment() -> void:
	if background_mode > 0 and background_mode - 1 < background_textures.size():
		draw_texture_rect(background_textures[background_mode - 1], Rect2(Vector2.ZERO, DESIGN_SIZE), false)
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color(0.005, 0.012, 0.028, 0.18))
	else:
		draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#070c16"))
		draw_rect(Rect2(0.0, 104.0, 1920.0, 560.0), Color("#0c1725"))
		for band_index: int in range(8):
			var x: float = 90.0 + float(band_index) * 260.0
			draw_rect(Rect2(x, 170.0, 110.0, 480.0), Color(0.05, 0.11, 0.16, 0.34))
			draw_line(Vector2(x + 18.0, 170.0), Vector2(x + 18.0, 650.0), Color(0.25, 0.48, 0.53, 0.16), 2.0)
		draw_rect(Rect2(0.0, 664.0, 1920.0, 344.0), Color("#11151c"))
		for line_index: int in range(9):
			var line_y: float = 680.0 + float(line_index) * 40.0
			draw_line(Vector2(0.0, line_y), Vector2(1920.0, line_y), Color(0.32, 0.42, 0.48, 0.12), 1.0)
		draw_line(Vector2(0.0, 664.0), Vector2(1920.0, 664.0), Color(UI_CYAN, 0.28), 2.0)


func _draw_formation(branch: String) -> void:
	_draw_panel(Rect2(34.0, 142.0, 820.0, 306.0), UI_CYAN)
	var font: Font = ThemeDB.fallback_font
	draw_string(font, Vector2(64.0, 184.0), "COMPLETE PARTY • CHOICE %s" % branch.to_upper(), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 25, UI_WHITE)
	draw_string(font, Vector2(64.0, 224.0), "Real battle-scale silhouette and role-read review", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 15, UI_CYAN)
	draw_string(font, Vector2(64.0, 264.0), "All three studies share %.0f px visible height at 1080p." % _current_visible_height(), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, UI_WHITE)
	draw_string(font, Vector2(64.0, 300.0), "Same ground plane • authored party-facing direction • no per-choice correction", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_MUTED)
	draw_string(font, Vector2(64.0, 350.0), "Review: family coherence, role separation, material read, and weapon clarity.", HORIZONTAL_ALIGNMENT_LEFT, 750.0, 14, UI_GOLD)
	draw_string(font, Vector2(64.0, 402.0), "A/B changes the full wardrobe branch. It does not approve it.", HORIZONTAL_ALIGNMENT_LEFT, 750.0, 13, UI_RED)
	var positions: Array[Vector2] = [Vector2(1120.0, 854.0), Vector2(1444.0, 854.0), Vector2(1760.0, 854.0)]
	var roles: Array[String] = ["power", "critical", "queue"]
	for role_index: int in range(roles.size()):
		_draw_ground(positions[role_index], 126.0)
		_draw_combatant("%s-%s" % [roles[role_index], branch], positions[role_index], _current_visible_height(), show_overlays)
		_draw_role_label(positions[role_index] + Vector2(-112.0, 28.0), 224.0, _role_label(roles[role_index]), branch)


func _draw_comparison() -> void:
	draw_rect(Rect2(38.0, 126.0, 892.0, 786.0), Color(0.006, 0.014, 0.027, 0.56))
	draw_rect(Rect2(990.0, 126.0, 892.0, 786.0), Color(0.006, 0.014, 0.027, 0.56))
	draw_rect(Rect2(38.0, 126.0, 892.0, 786.0), Color(UI_CYAN, 0.38), false, 2.0)
	draw_rect(Rect2(990.0, 126.0, 892.0, 786.0), Color(UI_GOLD, 0.38), false, 2.0)
	var font: Font = ThemeDB.fallback_font
	draw_string(font, Vector2(68.0, 172.0), "CHOICE A • COMPLETE PARTY", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 20, UI_CYAN)
	draw_string(font, Vector2(1020.0, 172.0), "CHOICE B • COMPLETE PARTY", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 20, UI_GOLD)
	draw_string(font, Vector2(68.0, 205.0), "Equal 320 px comparison height • unapproved", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 12, UI_MUTED)
	draw_string(font, Vector2(1020.0, 205.0), "Equal 320 px comparison height • unapproved", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 12, UI_MUTED)
	var roles: Array[String] = ["power", "critical", "queue"]
	var left_positions: Array[Vector2] = [Vector2(224.0, 754.0), Vector2(494.0, 754.0), Vector2(766.0, 754.0)]
	var right_positions: Array[Vector2] = [Vector2(1176.0, 754.0), Vector2(1446.0, 754.0), Vector2(1718.0, 754.0)]
	for role_index: int in range(roles.size()):
		for branch_data: Array in [["a", left_positions], ["b", right_positions]]:
			var branch: String = str(branch_data[0])
			var positions: Array[Vector2] = branch_data[1] as Array[Vector2]
			var ground_point: Vector2 = positions[role_index]
			_draw_ground(ground_point, 104.0)
			_draw_combatant("%s-%s" % [roles[role_index], branch], ground_point, 320.0, show_overlays)
			_draw_role_label(ground_point + Vector2(-96.0, 26.0), 192.0, _role_label(roles[role_index]), branch)
	draw_string(font, Vector2(560.0, 958.0), "Compare the branch as a family before judging isolated costume details.", HORIZONTAL_ALIGNMENT_CENTER, 800.0, 14, UI_WHITE)


func _draw_mattes() -> void:
	var panel_rects: Array[Rect2] = [Rect2(32.0, 132.0, 594.0, 824.0), Rect2(663.0, 132.0, 594.0, 824.0), Rect2(1294.0, 132.0, 594.0, 824.0)]
	var matte_colors: Array[Color] = [Color("#0a0d13"), Color("#d7dde5"), Color("#737f8c")]
	var matte_labels: Array[String] = ["DARK MATTE", "LIGHT MATTE", "MID MATTE"]
	for panel_index: int in range(panel_rects.size()):
		var panel: Rect2 = panel_rects[panel_index]
		draw_rect(panel, matte_colors[panel_index])
		draw_rect(panel, Color(UI_MUTED, 0.62), false, 2.0)
		var font_color: Color = UI_WHITE if panel_index == 0 else Color("#111827")
		draw_string(ThemeDB.fallback_font, panel.position + Vector2(22.0, 38.0), "%s • %s" % [matte_labels[panel_index], _role_label(active_role)], HORIZONTAL_ALIGNMENT_LEFT, -1.0, 14, font_color)
		var left_ground: Vector2 = panel.position + Vector2(190.0, 640.0)
		var right_ground: Vector2 = panel.position + Vector2(414.0, 640.0)
		_draw_ground(left_ground, 88.0)
		_draw_ground(right_ground, 88.0)
		_draw_combatant("%s-a" % active_role, left_ground, 360.0, show_overlays)
		_draw_combatant("%s-b" % active_role, right_ground, 360.0, show_overlays)
		draw_string(ThemeDB.fallback_font, panel.position + Vector2(112.0, 722.0), "A", HORIZONTAL_ALIGNMENT_CENTER, 156.0, 18, UI_CYAN if panel_index == 0 else Color("#075985"))
		draw_string(ThemeDB.fallback_font, panel.position + Vector2(336.0, 722.0), "B", HORIZONTAL_ALIGNMENT_CENTER, 156.0, 18, UI_GOLD if panel_index == 0 else Color("#92400e"))
		draw_string(ThemeDB.fallback_font, panel.position + Vector2(54.0, 776.0), "Same 360 px silhouette height • same ground anchor rule", HORIZONTAL_ALIGNMENT_CENTER, 486.0, 11, font_color)


func _draw_diagnostic_grid() -> void:
	draw_rect(Rect2(20.0, 120.0, 1880.0, 856.0), Color(0.006, 0.012, 0.022, 0.86))
	var roles: Array[String] = ["power", "critical", "queue"]
	for branch_index: int in range(2):
		var branch: String = "a" if branch_index == 0 else "b"
		for role_index: int in range(3):
			var panel: Rect2 = Rect2(48.0 + float(role_index) * 620.0, 148.0 + float(branch_index) * 400.0, 584.0, 370.0)
			draw_rect(panel, Color(0.02, 0.03, 0.05, 0.90))
			draw_rect(panel, Color(UI_CYAN if branch == "a" else UI_GOLD, 0.48), false, 2.0)
			var study_id: String = "%s-%s" % [roles[role_index], branch]
			var ground: Vector2 = panel.position + Vector2(438.0, 300.0)
			_draw_ground(ground, 94.0)
			_draw_combatant(study_id, ground, 250.0, true)
			var bounds: Rect2i = asset_bounds.get(study_id, Rect2i()) as Rect2i
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 36.0), "%s • CHOICE %s" % [_role_label(roles[role_index]), branch.to_upper()], HORIZONTAL_ALIGNMENT_LEFT, 370.0, 15, UI_WHITE)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 72.0), "SOURCE 1024×1536 RGBA", HORIZONTAL_ALIGNMENT_LEFT, 350.0, 12, UI_MUTED)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 102.0), "ALPHA x%d y%d w%d h%d" % [bounds.position.x, bounds.position.y, bounds.size.x, bounds.size.y], HORIZONTAL_ALIGNMENT_LEFT, 350.0, 12, UI_CYAN)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 132.0), "ANCHOR (512,1356) • PROPOSED", HORIZONTAL_ALIGNMENT_LEFT, 350.0, 12, UI_GOLD)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 162.0), "180 px transparent bottom pad", HORIZONTAL_ALIGNMENT_LEFT, 350.0, 12, UI_GREEN)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 212.0), "One idle keyframe", HORIZONTAL_ALIGNMENT_LEFT, 260.0, 12, UI_RED)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 240.0), "No clips / sockets / masks", HORIZONTAL_ALIGNMENT_LEFT, 290.0, 12, UI_RED)
			draw_string(ThemeDB.fallback_font, panel.position + Vector2(20.0, 268.0), "Not package-ready", HORIZONTAL_ALIGNMENT_LEFT, 260.0, 12, UI_RED)


func _draw_combatant(study_id: String, ground_point: Vector2, visible_height: float, overlays: bool) -> void:
	if not asset_textures.has(study_id) or not asset_bounds.has(study_id):
		return
	var record: Dictionary = _record_for(study_id)
	var bounds: Rect2i = asset_bounds[study_id] as Rect2i
	var scale: float = visible_height / float(bounds.size.y)
	var anchor: Vector2 = Vector2(_array_to_vector2i(record.get("proposedGroundAnchor", [])))
	var texture: Texture2D = asset_textures[study_id] as Texture2D
	var texture_rect: Rect2 = Rect2(ground_point - anchor * scale, Vector2(texture.get_width(), texture.get_height()) * scale)
	draw_texture_rect(texture, texture_rect, false)
	if overlays:
		var alpha_rect: Rect2 = Rect2(texture_rect.position + Vector2(bounds.position) * scale, Vector2(bounds.size) * scale)
		draw_rect(texture_rect, Color(UI_MUTED, 0.55), false, 1.0)
		draw_rect(alpha_rect, Color(UI_CYAN, 0.92), false, 2.0)
		draw_line(ground_point + Vector2(-14.0, 0.0), ground_point + Vector2(14.0, 0.0), UI_GREEN, 2.0)
		draw_line(ground_point + Vector2(0.0, -14.0), ground_point + Vector2(0.0, 14.0), UI_GREEN, 2.0)


func _draw_ground(point: Vector2, half_width: float) -> void:
	_draw_ellipse(point + Vector2(0.0, 8.0), Vector2(half_width * 0.62, 15.0), Color(0.0, 0.0, 0.0, 0.48))
	draw_line(point + Vector2(-half_width, 0.0), point + Vector2(half_width, 0.0), Color(UI_GREEN, 0.26), 1.5)


func _draw_role_label(position: Vector2, width: float, label: String, branch: String) -> void:
	draw_rect(Rect2(position, Vector2(width, 42.0)), Color(0.003, 0.008, 0.020, 0.88))
	draw_rect(Rect2(position, Vector2(width, 42.0)), Color(UI_CYAN if branch == "a" else UI_GOLD, 0.42), false, 1.0)
	draw_string(ThemeDB.fallback_font, position + Vector2(8.0, 27.0), label, HORIZONTAL_ALIGNMENT_CENTER, width - 16.0, 12, UI_WHITE)


func _draw_header() -> void:
	draw_rect(Rect2(0.0, 0.0, 1920.0, 104.0), Color(0.003, 0.008, 0.020, 0.97))
	draw_line(Vector2(0.0, 104.0), Vector2(1920.0, 104.0), Color(UI_CYAN, 0.48), 2.0)
	draw_string(ThemeDB.fallback_font, Vector2(26.0, 38.0), "RANGE-BAND PARTY • A/B ART REVIEW", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 23, UI_WHITE)
	draw_string(ThemeDB.fallback_font, Vector2(26.0, 70.0), "SIX SINGLE-FRAME STUDIES • UNAPPROVED • NOT PACKAGED • NOT REGISTERED", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 13, UI_RED)
	draw_string(ThemeDB.fallback_font, Vector2(26.0, 92.0), _view_label(), HORIZONTAL_ALIGNMENT_LEFT, -1.0, 11, UI_CYAN)
	var branch_label: String = "A/B" if view_mode == VIEW_MOTION else active_branch.to_upper()
	draw_string(ThemeDB.fallback_font, Vector2(1290.0, 38.0), "ACTIVE BRANCH %s" % branch_label, HORIZONTAL_ALIGNMENT_RIGHT, 280.0, 15, UI_GOLD)
	draw_string(ThemeDB.fallback_font, Vector2(1590.0, 38.0), "HEIGHT %.0f px" % _current_visible_height(), HORIZONTAL_ALIGNMENT_RIGHT, 300.0, 15, UI_CYAN)
	draw_string(ThemeDB.fallback_font, Vector2(1290.0, 70.0), "BACKGROUND %s" % _background_label(), HORIZONTAL_ALIGNMENT_RIGHT, 600.0, 12, UI_MUTED)


func _draw_footer() -> void:
	draw_rect(Rect2(0.0, 1008.0, 1920.0, 72.0), Color(0.003, 0.008, 0.020, 0.97))
	draw_line(Vector2(0.0, 1008.0), Vector2(1920.0, 1008.0), Color(UI_CYAN, 0.42), 1.0)
	var controls: String = "1–5 views • A/B branch • C/Tab toggle • Q/W/E role • G background • O bounds • Z scale • R reset"
	if view_mode == VIEW_MOTION:
		controls = "SPACE play/pause • ←/→ 0.10 s • PgUp/PgDn frame • S 0.25×/1× • Home reset • 1–5 views"
	draw_string(ThemeDB.fallback_font, Vector2(24.0, 1038.0), controls, HORIZONTAL_ALIGNMENT_LEFT, 1500.0, 12, UI_MUTED)
	draw_string(ThemeDB.fallback_font, Vector2(24.0, 1065.0), "SELECTION GATE OPEN • concept, motion pipeline, anchor, scale, and background remain separate decisions", HORIZONTAL_ALIGNMENT_LEFT, 1500.0, 12, UI_RED)
	var evidence_label: String = "RESOLVED TIMELINE + ANCHOR PASS" if view_mode == VIEW_MOTION else "SOURCE IDENTITY + ALPHA PASS"
	draw_string(ThemeDB.fallback_font, Vector2(1550.0, 1048.0), evidence_label, HORIZONTAL_ALIGNMENT_RIGHT, 340.0, 12, UI_GREEN)


func _draw_panel(rect: Rect2, accent: Color) -> void:
	draw_rect(rect, Color(0.003, 0.008, 0.020, 0.90))
	draw_rect(Rect2(rect.position, Vector2(5.0, rect.size.y)), accent)
	draw_rect(rect, Color(accent, 0.36), false, 1.0)


func _draw_load_failure() -> void:
	draw_rect(Rect2(Vector2.ZERO, DESIGN_SIZE), Color("#13040a"))
	draw_rect(Rect2(230.0, 260.0, 1460.0, 540.0), Color(0.26, 0.012, 0.040, 0.96))
	draw_string(ThemeDB.fallback_font, Vector2(282.0, 326.0), "PARTY ART REVIEW VALIDATION FAILED", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 30, Color("#fda4af"))
	for error_index: int in range(mini(validation_errors.size(), 10)):
		draw_string(ThemeDB.fallback_font, Vector2(282.0, 382.0 + float(error_index) * 38.0), "• %s" % validation_errors[error_index], HORIZONTAL_ALIGNMENT_LEFT, 1340.0, 14, UI_WHITE)


func _record_for(study_id: String) -> Dictionary:
	for raw_record: Variant in asset_records:
		if raw_record is Dictionary:
			var record: Dictionary = raw_record as Dictionary
			if str(record.get("studyId", "")) == study_id:
				return record
	return {}


func _current_visible_height() -> float:
	var candidates: Array = manifest.get("visibleHeightCandidates1080", [320.0, 360.0, 400.0]) as Array
	return float(candidates[height_index])


func _role_label(role: String) -> String:
	if role == "power":
		return "POWER MELEE"
	if role == "critical":
		return "CRITICAL MELEE"
	return "QUEUE CONTROL"


func _view_label() -> String:
	if view_mode == VIEW_FORMATION:
		return "VIEW 1 • COMPLETE PARTY AT PROPOSED BATTLE SCALE"
	if view_mode == VIEW_COMPARISON:
		return "VIEW 2 • COMPLETE PARTY A/B SIDE-BY-SIDE"
	if view_mode == VIEW_MATTES:
		return "VIEW 3 • %s A/B ON DARK / LIGHT / MID MATTES" % _role_label(active_role)
	if view_mode == VIEW_DIAGNOSTIC:
		return "VIEW 4 • ALL SIX SOURCE / ALPHA / ANCHOR DIAGNOSTICS"
	return "VIEW 5 • A/B RESOLVED-TIMELINE MOTION REHEARSAL"


func _background_label() -> String:
	if background_mode == 0:
		return "NEUTRAL REVIEW STAGE"
	if background_mode - 1 < background_records.size() and background_records[background_mode - 1] is Dictionary:
		return str((background_records[background_mode - 1] as Dictionary).get("label", "UNAPPROVED"))
	return "UNAVAILABLE"


func _sha256_file(path: String) -> String:
	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var context: HashingContext = HashingContext.new()
	if context.start(HashingContext.HASH_SHA256) != OK:
		return ""
	while not file.eof_reached():
		var chunk: PackedByteArray = file.get_buffer(65536)
		if not chunk.is_empty():
			context.update(chunk)
	return context.finish().hex_encode().to_upper()


func _array_to_vector2i(value: Variant) -> Vector2i:
	if value is Array:
		var components: Array = value as Array
		if components.size() == 2:
			return Vector2i(int(components[0]), int(components[1]))
	return Vector2i(-1, -1)


func _array_to_rect2i(value: Variant) -> Rect2i:
	if value is Array:
		var components: Array = value as Array
		if components.size() == 4:
			return Rect2i(int(components[0]), int(components[1]), int(components[2]), int(components[3]))
	return Rect2i()


func _draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for point_index: int in range(36):
		var angle: float = TAU * float(point_index) / 36.0
		points.append(center + Vector2(cos(angle) * radii.x, sin(angle) * radii.y))
	draw_colored_polygon(points, color)


func _add_error(message: String) -> void:
	validation_errors.append(message)
	printerr("[Party Art Review] ERROR: %s" % message)


func _add_blocker(message: String) -> void:
	review_blockers.append(message)


func _report_validation() -> void:
	if validation_errors.is_empty():
		print("[Party Art Review] PASS: six combatant sources and two contextual backgrounds match pinned identity, encoding, dimensions, alpha bounds, and edge safety.")
		print("[Party Art Review] REVIEW ONLY: %d open package/approval blockers." % review_blockers.size())
		for blocker: String in review_blockers:
			print("[Party Art Review] BLOCKER: %s" % blocker)
	else:
		printerr("[Party Art Review] FAILED with %d error(s)." % validation_errors.size())


func _finish_validation_run() -> void:
	get_tree().quit(0 if validation_errors.is_empty() else 2)
