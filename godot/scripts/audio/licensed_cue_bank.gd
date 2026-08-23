class_name LicensedCueBank
extends Node

## Optional, locally staged licensed combat audio.
##
## The checked-in manifest is always validated. A completely empty staging root is
## a valid `absent` state so public source checkouts retain procedural fallbacks.
## Once any WAV is staged, however, the bank becomes strict: every declared asset
## must exist, match its SHA-256 and WAV metadata, preload successfully, and no
## unmanifested WAV may share the staging root.

const STATE_UNCONFIGURED := &"unconfigured"
const STATE_ABSENT := &"absent"
const STATE_READY := &"ready"
const STATE_INVALID := &"invalid"

const MANIFEST_SCHEMA_VERSION := 1
const MIN_PITCH_SCALE := 0.25
const MAX_PITCH_SCALE := 4.0
const DURATION_TOLERANCE_SECONDS := 0.002
const SILENT_VOLUME_DB := -80.0

const TOP_LEVEL_REQUIRED_KEYS: Array[String] = [
	"schemaVersion",
	"assetRoot",
	"licensedCueIds",
	"assets",
	"cues",
]
const TOP_LEVEL_ALLOWED_KEYS: Array[String] = [
	"schemaVersion",
	"assetRoot",
	"licensedCueIds",
	"assets",
	"cues",
	"provenance",
]
const PROVENANCE_KEYS: Array[String] = [
	"collection",
	"storefront",
	"licensor",
	"license",
	"licenseUrl",
	"purchaseProofPolicy",
]
const ASSET_KEYS: Array[String] = [
	"path",
	"sourcePack",
	"sourceRelativePath",
	"sha256",
	"sampleRate",
	"channels",
	"bitsPerSample",
	"durationSeconds",
	"strongestWindowSeconds",
]
const CUE_KEYS: Array[String] = [
	"durationSeconds",
	"contacts",
	"variations",
]
const LAYER_REQUIRED_KEYS: Array[String] = [
	"assetId",
	"gainDb",
]
const LAYER_OPTIONAL_KEYS: Array[String] = [
	"alignSeconds",
	"startSeconds",
	"notBeforeSeconds",
	"stopSeconds",
]

var _state: StringName = STATE_UNCONFIGURED
var _manifest_path := ""
var _audio_root := ""
var _manifest: Dictionary = {}
var _assets: Dictionary = {}
var _cues: Dictionary = {}
var _licensed_cue_ids: Array[StringName] = []
var _streams_by_asset_id: Dictionary = {}
var _resolved_paths_by_asset_id: Dictionary = {}
var _errors: Array[String] = []

var _active_players: Array[AudioStreamPlayer] = []
var _playback_generation := 0
var _muted := false
var _output_suppressed := false
var _output_db := -6.0


func configure(manifest_path: String, audio_root: String) -> bool:
	stop()
	_clear_configuration()
	_manifest_path = manifest_path
	_audio_root = _normalize_root(audio_root)

	if _manifest_path.is_empty():
		return _invalidate("Licensed audio manifest path must not be empty.")
	if _audio_root.is_empty():
		return _invalidate("Licensed audio root must not be empty.")
	if not _audio_root.begins_with("res://") and not _audio_root.is_absolute_path():
		return _invalidate("Licensed audio root must be a res:// or absolute local path.")
	if not FileAccess.file_exists(_manifest_path):
		return _invalidate("Licensed audio manifest does not exist: %s" % _manifest_path)

	var json := JSON.new()
	var parse_error := json.parse(FileAccess.get_file_as_string(_manifest_path))
	if parse_error != OK:
		return _invalidate(
			"Licensed audio manifest JSON failed at line %d: %s"
			% [json.get_error_line(), json.get_error_message()]
		)
	if typeof(json.data) != TYPE_DICTIONARY:
		return _invalidate("Licensed audio manifest root must be an object.")
	_manifest = json.data as Dictionary

	if not _validate_manifest_schema():
		_state = STATE_INVALID
		return false

	var staged_wavs := _scan_wav_files(_audio_root)
	if not _errors.is_empty():
		_state = STATE_INVALID
		return false

	var declared_paths: Array[String] = []
	var present_declared_count := 0
	for asset_id_value in _assets.keys():
		var asset_id := str(asset_id_value)
		var asset := _assets[asset_id] as Dictionary
		var resolved_path := _resolve_asset_path(str(asset["path"]))
		if resolved_path.is_empty():
			_add_error("Asset '%s' resolves outside the licensed audio root." % asset_id)
			continue
		_resolved_paths_by_asset_id[asset_id] = resolved_path
		declared_paths.append(resolved_path)
		if FileAccess.file_exists(resolved_path):
			present_declared_count += 1

	if not _errors.is_empty():
		_state = STATE_INVALID
		return false

	# A source checkout deliberately contains no proprietary files. It is a valid
	# fallback state only when the staging root is truly empty.
	if staged_wavs.is_empty() and present_declared_count == 0:
		_state = STATE_ABSENT
		return true

	var declared_set := {}
	for path in declared_paths:
		declared_set[path] = true
	var staged_set := {}
	for path in staged_wavs:
		staged_set[path] = true

	for path in staged_wavs:
		if not declared_set.has(path):
			_add_error("Unmanifested licensed WAV is staged: %s" % path)
	for path in declared_paths:
		if not staged_set.has(path) or not FileAccess.file_exists(path):
			_add_error("Manifest-declared licensed WAV is missing: %s" % path)

	if not _errors.is_empty():
		_state = STATE_INVALID
		return false

	for asset_id_value in _assets.keys():
		var asset_id := str(asset_id_value)
		var asset := _assets[asset_id] as Dictionary
		var resolved_path := str(_resolved_paths_by_asset_id[asset_id])
		if not _validate_and_preload_asset(asset_id, asset, resolved_path):
			continue

	if not _errors.is_empty() or _streams_by_asset_id.size() != _assets.size():
		_state = STATE_INVALID
		_streams_by_asset_id.clear()
		return false

	_state = STATE_READY
	return true


func state() -> StringName:
	return _state


func is_valid() -> bool:
	return _state == STATE_ABSENT or _state == STATE_READY


func is_absent() -> bool:
	return _state == STATE_ABSENT


func is_ready() -> bool:
	return _state == STATE_READY


func errors() -> Array[String]:
	return _errors.duplicate()


func manifest_cue_ids() -> Array[StringName]:
	return _licensed_cue_ids.duplicate()


func declared_asset_count() -> int:
	return _assets.size()


func loaded_asset_count() -> int:
	return _streams_by_asset_id.size()


func supports_cue(cue_id: StringName) -> bool:
	return _state == STATE_READY and _cues.has(str(cue_id))


func play_cue(cue_id: StringName, sequence: int, pitch_scale: float = 1.0) -> Dictionary:
	if not supports_cue(cue_id):
		return {}
	if not _is_finite_number(pitch_scale):
		push_error("Licensed audio pitch scale must be finite.")
		return {}
	var safe_pitch := clampf(pitch_scale, MIN_PITCH_SCALE, MAX_PITCH_SCALE)
	if not is_equal_approx(safe_pitch, pitch_scale):
		push_error(
			"Licensed audio pitch scale %.4f is outside %.2f..%.2f."
			% [pitch_scale, MIN_PITCH_SCALE, MAX_PITCH_SCALE]
		)
		return {}
	if not is_inside_tree() and not _output_suppressed:
		push_error("Licensed cue bank must be inside the scene tree before playback.")
		return {}

	var cue := _cues[str(cue_id)] as Dictionary
	var variations := cue["variations"] as Array
	var variation_index := _positive_modulo(sequence, variations.size())
	var layers := variations[variation_index] as Array
	var cue_duration := float(cue["durationSeconds"])
	var generation := _begin_playback()
	var scheduled_layers: Array[Dictionary] = []

	for layer_value in layers:
		var layer := layer_value as Dictionary
		var asset_id := str(layer["assetId"])
		var asset := _assets[asset_id] as Dictionary
		var plan := _build_layer_plan(layer, asset, cue_duration, safe_pitch)
		if plan.is_empty():
			stop()
			push_error("Licensed cue '%s' produced an invalid layer plan." % cue_id)
			return {}
		scheduled_layers.append(plan)
		if not _output_suppressed:
			_schedule_layer(asset_id, plan, generation, safe_pitch)

	var contacts := PackedFloat32Array()
	for contact_value in cue["contacts"] as Array:
		contacts.append(float(contact_value))

	return {
		"playback_ready": true,
		"licensed": true,
		"cue_id": cue_id,
		"variation_index": variation_index,
		"layer_count": layers.size(),
		"duration_seconds": cue_duration,
		"contacts": contacts,
		"pitch_scale": safe_pitch,
		"layers": scheduled_layers,
	}


func stop() -> void:
	_playback_generation += 1
	for player in _active_players:
		if is_instance_valid(player):
			player.stop()
			player.queue_free()
	_active_players.clear()


func shutdown() -> void:
	stop()


func set_muted(muted: bool) -> void:
	_muted = muted
	_apply_output_levels()


func is_muted() -> bool:
	return _muted


func toggle_muted() -> bool:
	set_muted(not _muted)
	return _muted


func set_output_db(level_db: float) -> void:
	if not _is_finite_number(level_db):
		push_error("Licensed audio output level must be finite.")
		return
	_output_db = clampf(level_db, -48.0, 0.0)
	_apply_output_levels()


func get_output_db() -> float:
	return _output_db


func set_output_suppressed(suppressed: bool) -> void:
	_output_suppressed = suppressed
	_apply_output_levels()


func is_output_suppressed() -> bool:
	return _output_suppressed


func has_active_playback() -> bool:
	return not _active_players.is_empty()


func _clear_configuration() -> void:
	_state = STATE_UNCONFIGURED
	_manifest = {}
	_assets = {}
	_cues = {}
	_licensed_cue_ids.clear()
	_streams_by_asset_id.clear()
	_resolved_paths_by_asset_id.clear()
	_errors.clear()


func _validate_manifest_schema() -> bool:
	if not _validate_exact_keys(
		_manifest,
		TOP_LEVEL_ALLOWED_KEYS,
		TOP_LEVEL_REQUIRED_KEYS,
		"manifest"
	):
		return false
	if not _is_integer_number(_manifest["schemaVersion"]):
		_add_error("Manifest schemaVersion must be an integer-valued number.")
	elif int(float(_manifest["schemaVersion"])) != MANIFEST_SCHEMA_VERSION:
		_add_error(
			"Unsupported licensed audio schemaVersion %s; expected %d."
			% [str(_manifest["schemaVersion"]), MANIFEST_SCHEMA_VERSION]
		)

	if typeof(_manifest["assetRoot"]) != TYPE_STRING:
		_add_error("Manifest assetRoot must be a string.")
	else:
		var raw_manifest_root := str(_manifest["assetRoot"]).replace("\\", "/")
		var manifest_root_value := raw_manifest_root.trim_prefix("/")
		var canonical_res_root := "res://" + manifest_root_value
		var absolute_suffix := "/" + manifest_root_value
		if (
			manifest_root_value.is_empty()
			or raw_manifest_root.begins_with("/")
			or raw_manifest_root.contains(":")
			or _has_parent_segment(manifest_root_value)
			or (
				_audio_root != canonical_res_root
				and not (
					_audio_root.is_absolute_path()
					and _audio_root.to_lower().ends_with(absolute_suffix.to_lower())
				)
			)
		):
			_add_error(
				"Manifest assetRoot '%s' does not match configured root '%s'."
				% [manifest_root_value, _audio_root]
			)

	if typeof(_manifest["licensedCueIds"]) != TYPE_ARRAY:
		_add_error("Manifest licensedCueIds must be an array.")
	if typeof(_manifest["assets"]) != TYPE_DICTIONARY:
		_add_error("Manifest assets must be an object.")
	if typeof(_manifest["cues"]) != TYPE_DICTIONARY:
		_add_error("Manifest cues must be an object.")
	if _manifest.has("provenance"):
		if typeof(_manifest["provenance"]) != TYPE_DICTIONARY:
			_add_error("Manifest provenance must be an object when present.")
		else:
			var provenance := _manifest["provenance"] as Dictionary
			if _validate_exact_keys(provenance, PROVENANCE_KEYS, PROVENANCE_KEYS, "provenance"):
				for field in PROVENANCE_KEYS:
					if typeof(provenance[field]) != TYPE_STRING or str(provenance[field]).is_empty():
						_add_error("Manifest provenance field %s must be a non-empty string." % field)
	if not _errors.is_empty():
		return false

	_assets = _manifest["assets"] as Dictionary
	_cues = _manifest["cues"] as Dictionary
	if _assets.is_empty():
		_add_error("Manifest must declare at least one licensed asset.")
	if _cues.is_empty():
		_add_error("Manifest must declare at least one licensed cue.")

	var licensed_ids_seen := {}
	for cue_id_value in _manifest["licensedCueIds"] as Array:
		if typeof(cue_id_value) != TYPE_STRING or str(cue_id_value).is_empty():
			_add_error("Every licensedCueIds entry must be a non-empty string.")
			continue
		var cue_id := str(cue_id_value)
		if licensed_ids_seen.has(cue_id):
			_add_error("Duplicate licensed cue ID: %s" % cue_id)
			continue
		licensed_ids_seen[cue_id] = true
		_licensed_cue_ids.append(StringName(cue_id))

	for cue_id_value in _cues.keys():
		var cue_id := str(cue_id_value)
		if not licensed_ids_seen.has(cue_id):
			_add_error("Cue '%s' is missing from licensedCueIds." % cue_id)
	for cue_id_value in licensed_ids_seen.keys():
		var cue_id := str(cue_id_value)
		if not _cues.has(cue_id):
			_add_error("licensedCueIds references undeclared cue '%s'." % cue_id)

	var resolved_paths_seen := {}
	for asset_id_value in _assets.keys():
		var asset_id := str(asset_id_value)
		var asset_value: Variant = _assets[asset_id_value]
		if asset_id.is_empty() or typeof(asset_value) != TYPE_DICTIONARY:
			_add_error("Every asset must use a non-empty ID and object value.")
			continue
		var asset := asset_value as Dictionary
		if not _validate_exact_keys(asset, ASSET_KEYS, ASSET_KEYS, "asset '%s'" % asset_id):
			continue
		_validate_asset_schema(asset_id, asset, resolved_paths_seen)

	var used_asset_ids := {}
	for cue_id_value in _cues.keys():
		var cue_id := str(cue_id_value)
		var cue_value: Variant = _cues[cue_id_value]
		if cue_id.is_empty() or typeof(cue_value) != TYPE_DICTIONARY:
			_add_error("Every cue must use a non-empty ID and object value.")
			continue
		var cue := cue_value as Dictionary
		if not _validate_exact_keys(cue, CUE_KEYS, CUE_KEYS, "cue '%s'" % cue_id):
			continue
		_validate_cue_schema(cue_id, cue, used_asset_ids)

	for asset_id_value in _assets.keys():
		var asset_id := str(asset_id_value)
		if not used_asset_ids.has(asset_id):
			_add_error("Licensed asset '%s' is declared but unused." % asset_id)

	return _errors.is_empty()


func _validate_asset_schema(asset_id: String, asset: Dictionary, paths_seen: Dictionary) -> void:
	for field in ["path", "sourcePack", "sourceRelativePath", "sha256"]:
		if typeof(asset[field]) != TYPE_STRING or str(asset[field]).is_empty():
			_add_error("Asset '%s' field %s must be a non-empty string." % [asset_id, field])

	if typeof(asset["path"]) == TYPE_STRING:
		var resolved_path := _resolve_asset_path(str(asset["path"]))
		if resolved_path.is_empty():
			_add_error("Asset '%s' path is unsafe or outside assetRoot." % asset_id)
		elif not resolved_path.to_lower().ends_with(".wav"):
			_add_error("Asset '%s' runtime path must end in .wav." % asset_id)
		elif paths_seen.has(resolved_path):
			_add_error("Assets share runtime path: %s" % resolved_path)
		else:
			paths_seen[resolved_path] = true

	if typeof(asset["sourceRelativePath"]) == TYPE_STRING:
		var source_path := str(asset["sourceRelativePath"]).replace("\\", "/")
		if source_path.begins_with("/") or source_path.contains(":") or _has_parent_segment(source_path):
			_add_error("Asset '%s' sourceRelativePath must remain relative and traversal-free." % asset_id)

	if typeof(asset["sha256"]) == TYPE_STRING and not _is_sha256(str(asset["sha256"])):
		_add_error("Asset '%s' sha256 must contain exactly 64 hexadecimal characters." % asset_id)

	_validate_integer_range(asset_id, asset, "sampleRate", 8000, 192000)
	_validate_integer_range(asset_id, asset, "channels", 1, 8)
	_validate_integer_range(asset_id, asset, "bitsPerSample", 8, 64)

	if not _is_finite_number(asset["durationSeconds"]) or float(asset["durationSeconds"]) <= 0.0:
		_add_error("Asset '%s' durationSeconds must be finite and positive." % asset_id)
	if not _is_finite_number(asset["strongestWindowSeconds"]):
		_add_error("Asset '%s' strongestWindowSeconds must be finite." % asset_id)
	elif _is_finite_number(asset["durationSeconds"]):
		var strongest := float(asset["strongestWindowSeconds"])
		var duration := float(asset["durationSeconds"])
		if strongest < 0.0 or strongest > duration:
			_add_error("Asset '%s' strongestWindowSeconds lies outside its duration." % asset_id)


func _validate_cue_schema(cue_id: String, cue: Dictionary, used_assets: Dictionary) -> void:
	if not _is_finite_number(cue["durationSeconds"]) or float(cue["durationSeconds"]) <= 0.0:
		_add_error("Cue '%s' durationSeconds must be finite and positive." % cue_id)
		return
	var cue_duration := float(cue["durationSeconds"])

	if typeof(cue["contacts"]) != TYPE_ARRAY:
		_add_error("Cue '%s' contacts must be an array." % cue_id)
	else:
		var previous_contact := -1.0
		for contact_value in cue["contacts"] as Array:
			if not _is_finite_number(contact_value):
				_add_error("Cue '%s' contacts must be finite numbers." % cue_id)
				continue
			var contact := float(contact_value)
			if contact < 0.0 or contact > cue_duration or contact <= previous_contact:
				_add_error("Cue '%s' contacts must be ordered, unique, and within duration." % cue_id)
			previous_contact = contact

	if typeof(cue["variations"]) != TYPE_ARRAY:
		_add_error("Cue '%s' variations must be an array." % cue_id)
		return
	var variations := cue["variations"] as Array
	if variations.is_empty():
		_add_error("Cue '%s' must declare at least one variation." % cue_id)
		return

	for variation_index in variations.size():
		var variation_value: Variant = variations[variation_index]
		if typeof(variation_value) != TYPE_ARRAY or (variation_value as Array).is_empty():
			_add_error("Cue '%s' variation %d must be a non-empty layer array." % [cue_id, variation_index])
			continue
		for layer_index in (variation_value as Array).size():
			var layer_value: Variant = (variation_value as Array)[layer_index]
			if typeof(layer_value) != TYPE_DICTIONARY:
				_add_error(
					"Cue '%s' variation %d layer %d must be an object."
					% [cue_id, variation_index, layer_index]
				)
				continue
			var layer := layer_value as Dictionary
			var allowed_layer_keys: Array[String] = LAYER_REQUIRED_KEYS.duplicate()
			allowed_layer_keys.append_array(LAYER_OPTIONAL_KEYS)
			if not _validate_exact_keys(
				layer,
				allowed_layer_keys,
				LAYER_REQUIRED_KEYS,
				"cue '%s' variation %d layer %d" % [cue_id, variation_index, layer_index]
			):
				continue
			_validate_layer_schema(cue_id, variation_index, layer_index, layer, cue_duration, used_assets)


func _validate_layer_schema(
	cue_id: String,
	variation_index: int,
	layer_index: int,
	layer: Dictionary,
	cue_duration: float,
	used_assets: Dictionary
) -> void:
	var label := "Cue '%s' variation %d layer %d" % [cue_id, variation_index, layer_index]
	if typeof(layer["assetId"]) != TYPE_STRING or str(layer["assetId"]).is_empty():
		_add_error("%s assetId must be a non-empty string." % label)
		return
	var asset_id := str(layer["assetId"])
	if not _assets.has(asset_id):
		_add_error("%s references undeclared asset '%s'." % [label, asset_id])
		return
	used_assets[asset_id] = true

	if not _is_finite_number(layer["gainDb"]):
		_add_error("%s gainDb must be finite." % label)
	elif float(layer["gainDb"]) > 0.0:
		_add_error("%s gainDb %.3f exceeds the 0 dB ceiling." % [label, float(layer["gainDb"])])

	var asset := _assets[asset_id] as Dictionary
	var start_seconds := _optional_number(layer, "startSeconds", 0.0)
	var stop_seconds := _optional_number(layer, "stopSeconds", cue_duration)
	var not_before := _optional_number(layer, "notBeforeSeconds", 0.0)

	for optional_key in LAYER_OPTIONAL_KEYS:
		if layer.has(optional_key) and not _is_finite_number(layer[optional_key]):
			_add_error("%s %s must be finite." % [label, optional_key])

	if start_seconds < 0.0 or start_seconds >= cue_duration:
		_add_error("%s startSeconds lies outside the cue duration." % label)
	if stop_seconds <= start_seconds or stop_seconds > cue_duration + DURATION_TOLERANCE_SECONDS:
		_add_error("%s stopSeconds must be after startSeconds and within the cue." % label)
	if not_before < 0.0 or not_before >= cue_duration:
		_add_error("%s notBeforeSeconds lies outside the cue duration." % label)
	if stop_seconds <= not_before:
		_add_error("%s stopSeconds must be after notBeforeSeconds." % label)

	if layer.has("alignSeconds") and _is_finite_number(layer["alignSeconds"]):
		var align_seconds := float(layer["alignSeconds"])
		if align_seconds < maxf(not_before, start_seconds) or align_seconds > cue_duration:
			_add_error("%s alignSeconds must be at/after notBeforeSeconds and within the cue." % label)
		if align_seconds > stop_seconds:
			_add_error("%s alignSeconds must not fall after stopSeconds." % label)

	if _errors.is_empty() and _build_layer_plan(layer, asset, cue_duration, 1.0).is_empty():
		_add_error("%s cannot produce a valid aligned playback plan." % label)


func _validate_and_preload_asset(asset_id: String, asset: Dictionary, path: String) -> bool:
	var actual_sha := FileAccess.get_sha256(path).to_lower()
	var expected_sha := str(asset["sha256"]).to_lower()
	if actual_sha != expected_sha:
		_add_error(
			"Licensed asset '%s' SHA-256 mismatch: expected %s, received %s."
			% [asset_id, expected_sha, actual_sha]
		)
		return false

	var wav_metadata := _read_wav_metadata(path)
	if wav_metadata.is_empty():
		_add_error("Licensed asset '%s' is not a supported RIFF/WAVE file." % asset_id)
		return false
	if int(wav_metadata["sampleRate"]) != int(asset["sampleRate"]):
		_add_error("Licensed asset '%s' sampleRate does not match its manifest." % asset_id)
	if int(wav_metadata["channels"]) != int(asset["channels"]):
		_add_error("Licensed asset '%s' channel count does not match its manifest." % asset_id)
	if int(wav_metadata["bitsPerSample"]) != int(asset["bitsPerSample"]):
		_add_error("Licensed asset '%s' bit depth does not match its manifest." % asset_id)
	if absf(float(wav_metadata["durationSeconds"]) - float(asset["durationSeconds"])) > DURATION_TOLERANCE_SECONDS:
		_add_error("Licensed asset '%s' duration does not match its manifest." % asset_id)
	if not _errors.is_empty():
		return false

	var stream := AudioStreamWAV.load_from_file(path)
	if stream == null:
		_add_error("Licensed asset '%s' failed AudioStreamWAV.load_from_file: %s" % [asset_id, path])
		return false
	if absf(stream.get_length() - float(asset["durationSeconds"])) > DURATION_TOLERANCE_SECONDS:
		_add_error("Licensed asset '%s' decoded length diverges from its manifest." % asset_id)
		return false
	_streams_by_asset_id[asset_id] = stream
	return true


func _read_wav_metadata(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	file.big_endian = false
	if file.get_length() < 44:
		return {}
	var riff := file.get_buffer(4).get_string_from_ascii()
	file.get_32()
	var wave := file.get_buffer(4).get_string_from_ascii()
	if riff != "RIFF" or wave != "WAVE":
		return {}

	var format_code := 0
	var channels := 0
	var sample_rate := 0
	var byte_rate := 0
	var bits_per_sample := 0
	var data_size := 0

	while file.get_position() + 8 <= file.get_length():
		var chunk_id := file.get_buffer(4).get_string_from_ascii()
		var chunk_size := int(file.get_32())
		var chunk_start := file.get_position()
		if chunk_size < 0 or chunk_start + chunk_size > file.get_length():
			return {}
		if chunk_id == "fmt ":
			if chunk_size < 16:
				return {}
			format_code = int(file.get_16())
			channels = int(file.get_16())
			sample_rate = int(file.get_32())
			byte_rate = int(file.get_32())
			file.get_16()
			bits_per_sample = int(file.get_16())
		elif chunk_id == "data":
			data_size = chunk_size
		var next_chunk := chunk_start + chunk_size + (chunk_size % 2)
		file.seek(next_chunk)
		if format_code > 0 and data_size > 0:
			break

	if (format_code != 1 and format_code != 3) or channels <= 0 or sample_rate <= 0 or byte_rate <= 0 or data_size <= 0:
		return {}
	return {
		"formatCode": format_code,
		"channels": channels,
		"sampleRate": sample_rate,
		"bitsPerSample": bits_per_sample,
		"durationSeconds": float(data_size) / float(byte_rate),
	}


func _build_layer_plan(
	layer: Dictionary,
	asset: Dictionary,
	cue_duration: float,
	pitch_scale: float
) -> Dictionary:
	var asset_duration := float(asset["durationSeconds"])
	var strongest := float(asset["strongestWindowSeconds"])
	var requested_start := _optional_number(layer, "startSeconds", 0.0)
	var not_before := _optional_number(layer, "notBeforeSeconds", 0.0)
	var has_alignment := layer.has("alignSeconds")
	var align_seconds := float(layer["alignSeconds"]) if has_alignment else -1.0
	var alignment_start := align_seconds - strongest / pitch_scale if has_alignment else 0.0
	var scheduled_start := maxf(0.0, maxf(not_before, maxf(requested_start, alignment_start)))
	var source_start := (
		strongest - (align_seconds - scheduled_start) * pitch_scale
		if has_alignment
		else 0.0
	)
	if absf(source_start) <= DURATION_TOLERANCE_SECONDS:
		source_start = 0.0
	if absf(source_start - strongest) <= DURATION_TOLERANCE_SECONDS:
		source_start = strongest

	if (
		source_start < -DURATION_TOLERANCE_SECONDS
		or source_start > strongest + DURATION_TOLERANCE_SECONDS
		or source_start >= asset_duration
		or scheduled_start < not_before
		or scheduled_start >= cue_duration
	):
		return {}

	var requested_stop := _optional_number(layer, "stopSeconds", cue_duration)
	var natural_stop := scheduled_start + (asset_duration - source_start) / pitch_scale
	var scheduled_stop := minf(cue_duration, minf(requested_stop, natural_stop))
	if scheduled_stop <= scheduled_start:
		return {}
	var source_stop := source_start + (scheduled_stop - scheduled_start) * pitch_scale
	var aligned_strongest := scheduled_start + (strongest - source_start) / pitch_scale
	if aligned_strongest > scheduled_stop + DURATION_TOLERANCE_SECONDS:
		return {}

	return {
		"asset_id": str(layer["assetId"]),
		"gain_db": minf(0.0, float(layer["gainDb"])),
		"source_start_seconds": source_start,
		"source_stop_seconds": source_stop,
		"scheduled_start_seconds": scheduled_start,
		"scheduled_stop_seconds": scheduled_stop,
		"aligned_strongest_window_seconds": aligned_strongest,
		"not_before_seconds": not_before,
	}


func _schedule_layer(
	asset_id: String,
	plan: Dictionary,
	generation: int,
	pitch_scale: float
) -> void:
	var stream := _streams_by_asset_id[asset_id] as AudioStreamWAV
	var player := AudioStreamPlayer.new()
	player.name = "Licensed_%s" % asset_id.validate_node_name()
	player.stream = stream
	player.pitch_scale = pitch_scale
	player.set_meta("layer_gain_db", float(plan["gain_db"]))
	add_child(player)
	_active_players.append(player)
	_apply_player_level(player)
	player.finished.connect(_finish_layer.bind(player, generation), CONNECT_ONE_SHOT)

	var start_delay := float(plan["scheduled_start_seconds"])
	var stop_delay := float(plan["scheduled_stop_seconds"])
	if start_delay <= 0.000001:
		_start_layer(player, float(plan["source_start_seconds"]), generation)
	else:
		get_tree().create_timer(start_delay).timeout.connect(
			_start_layer.bind(player, float(plan["source_start_seconds"]), generation),
			CONNECT_ONE_SHOT
		)
	get_tree().create_timer(stop_delay).timeout.connect(
		_finish_layer.bind(player, generation),
		CONNECT_ONE_SHOT
	)


func _start_layer(player: AudioStreamPlayer, source_start: float, generation: int) -> void:
	if generation != _playback_generation or not is_instance_valid(player):
		return
	player.play(source_start)


func _finish_layer(player: AudioStreamPlayer, generation: int) -> void:
	if generation != _playback_generation or not is_instance_valid(player):
		return
	player.stop()
	_active_players.erase(player)
	player.queue_free()


func _begin_playback() -> int:
	stop()
	return _playback_generation


func _apply_output_levels() -> void:
	for player in _active_players:
		if is_instance_valid(player):
			_apply_player_level(player)


func _apply_player_level(player: AudioStreamPlayer) -> void:
	if _muted or _output_suppressed:
		player.volume_db = SILENT_VOLUME_DB
		return
	var layer_gain := float(player.get_meta("layer_gain_db", 0.0))
	player.volume_db = minf(0.0, _output_db + minf(0.0, layer_gain))


func _scan_wav_files(root: String) -> Array[String]:
	var results: Array[String] = []
	if not DirAccess.dir_exists_absolute(root):
		return results
	_scan_wav_files_recursive(root, results)
	results.sort()
	return results


func _scan_wav_files_recursive(root: String, results: Array[String]) -> void:
	var directory := DirAccess.open(root)
	if directory == null:
		_add_error("Unable to inspect licensed audio directory: %s" % root)
		return
	directory.list_dir_begin()
	while true:
		var entry := directory.get_next()
		if entry.is_empty():
			break
		if entry == "." or entry == "..":
			continue
		var path := root.path_join(entry).replace("\\", "/").simplify_path()
		if directory.current_is_dir():
			_scan_wav_files_recursive(path, results)
		elif entry.to_lower().ends_with(".wav"):
			results.append(path)
	directory.list_dir_end()


func _resolve_asset_path(manifest_path_value: String) -> String:
	if manifest_path_value.is_empty() or manifest_path_value.contains("\\"):
		return ""
	if _has_parent_segment(manifest_path_value):
		return ""
	var resolved := (
		manifest_path_value.simplify_path()
		if manifest_path_value.begins_with("res://")
		else _audio_root.path_join(manifest_path_value).simplify_path()
	)
	if resolved == _audio_root or not resolved.begins_with(_audio_root + "/"):
		return ""
	return resolved


func _normalize_root(path: String) -> String:
	var normalized := path.strip_edges().replace("\\", "/")
	if normalized.is_empty():
		return ""
	if not normalized.begins_with("res://") and not normalized.is_absolute_path():
		normalized = "res://" + normalized.trim_prefix("/")
	return normalized.simplify_path().trim_suffix("/")


func _has_parent_segment(path: String) -> bool:
	for segment in path.replace("\\", "/").split("/", false):
		if segment == "..":
			return true
	return false


func _validate_exact_keys(
	value: Dictionary,
	allowed: Array[String],
	required: Array[String],
	label: String
) -> bool:
	var valid := true
	for key_value in value.keys():
		var key := str(key_value)
		if not allowed.has(key):
			_add_error("%s contains unknown key '%s'." % [label, key])
			valid = false
	for key in required:
		if not value.has(key):
			_add_error("%s is missing required key '%s'." % [label, key])
			valid = false
	return valid


func _validate_integer_range(
	asset_id: String,
	asset: Dictionary,
	field: String,
	minimum: int,
	maximum: int
) -> void:
	if not _is_integer_number(asset[field]):
		_add_error("Asset '%s' %s must be an integer-valued number." % [asset_id, field])
		return
	var value := int(float(asset[field]))
	if value < minimum or value > maximum:
		_add_error("Asset '%s' %s lies outside %d..%d." % [asset_id, field, minimum, maximum])


func _optional_number(value: Dictionary, key: String, fallback: float) -> float:
	if not value.has(key) or not _is_finite_number(value[key]):
		return fallback
	return float(value[key])


func _is_finite_number(value: Variant) -> bool:
	if typeof(value) != TYPE_INT and typeof(value) != TYPE_FLOAT:
		return false
	var number := float(value)
	return not is_nan(number) and not is_inf(number)


func _is_integer_number(value: Variant) -> bool:
	if not _is_finite_number(value):
		return false
	var number := float(value)
	return is_equal_approx(number, round(number))


func _is_sha256(value: String) -> bool:
	if value.length() != 64:
		return false
	for index in value.length():
		var character := value.substr(index, 1).to_lower()
		if not "0123456789abcdef".contains(character):
			return false
	return true


func _positive_modulo(value: int, divisor: int) -> int:
	return ((value % divisor) + divisor) % divisor


func _add_error(message: String) -> void:
	_errors.append(message)
	push_error(message)


func _invalidate(message: String) -> bool:
	_add_error(message)
	_state = STATE_INVALID
	return false
