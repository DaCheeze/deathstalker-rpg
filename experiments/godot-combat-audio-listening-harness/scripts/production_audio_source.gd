class_name ProductionAudioSource
extends RefCounted

## Loads the canonical production scripts as source so this isolated Godot project
## executes the live implementation without carrying a synthesis fork.

const PRODUCTION_SYNTH_RELATIVE_PATH := "../../godot/scripts/procedural_combat_audio.gd"
const RANGED_BANK_RELATIVE_PATH := "../../godot/scripts/audio/ranged_cue_bank.gd"
const LICENSED_BANK_RELATIVE_PATH := "../../godot/scripts/audio/licensed_cue_bank.gd"
const LICENSED_MANIFEST_RELATIVE_PATH := "../../godot/data/licensed-combat-audio-manifest-v1.json"
const LICENSED_AUDIO_ROOT_RELATIVE_PATH := "../../godot/assets/audio/licensed"


static func source_path() -> String:
	var project_root := ProjectSettings.globalize_path("res://")
	return project_root.path_join(PRODUCTION_SYNTH_RELATIVE_PATH).simplify_path()


static func load_script() -> GDScript:
	return _load_source_script(source_path(), "Production combat audio")


static func install_dependencies(synth: Variant, audio_mode: String = "auto") -> bool:
	if not ["auto", "procedural", "licensed"].has(audio_mode):
		push_error("Listening harness received an unknown audio mode: %s" % audio_mode)
		return false
	var project_root := ProjectSettings.globalize_path("res://")
	var ranged_path := project_root.path_join(RANGED_BANK_RELATIVE_PATH).simplify_path()
	var ranged_script := _load_source_script(ranged_path, "Production ranged cue bank")
	if ranged_script == null:
		return false
	if not bool(synth.install_ranged_bank(ranged_script.new())):
		return false
	if audio_mode == "procedural":
		return bool(synth.configure_audio_mode(audio_mode))

	var licensed_path := project_root.path_join(LICENSED_BANK_RELATIVE_PATH).simplify_path()
	var licensed_script := _load_source_script(licensed_path, "Production licensed cue bank")
	if licensed_script == null:
		return false
	var licensed_bank: Node = licensed_script.new()
	var manifest_path := project_root.path_join(LICENSED_MANIFEST_RELATIVE_PATH).simplify_path()
	var audio_root := project_root.path_join(LICENSED_AUDIO_ROOT_RELATIVE_PATH).simplify_path()
	if not bool(licensed_bank.configure(manifest_path, audio_root)):
		licensed_bank.free()
		return false
	if not bool(synth.install_licensed_bank(licensed_bank)):
		licensed_bank.free()
		return false
	return bool(synth.configure_audio_mode(audio_mode))


static func _load_source_script(path: String, label: String) -> GDScript:
	if not FileAccess.file_exists(path):
		push_error("%s source does not exist: %s" % [label, path])
		return null
	var source := FileAccess.get_file_as_string(path)
	if source.is_empty():
		push_error("%s source is empty: %s" % [label, path])
		return null
	var script := GDScript.new()
	script.source_code = source
	var reload_error := script.reload()
	if reload_error != OK:
		push_error(
			"%s source failed to compile (%s): %s"
			% [label, error_string(reload_error), path]
		)
		return null
	return script
