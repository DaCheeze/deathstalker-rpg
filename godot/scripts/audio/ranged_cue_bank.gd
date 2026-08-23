class_name RangedCueBank
extends RefCounted

# File-free, deterministic ranged-weapon PCM for the canonical Godot client.
# This bank owns synthesis only: cue selection and contact timing arrive already
# resolved by the authoritative presentation bridge.

const DEFAULT_MIX_RATE := 48000.0
const MIN_MIX_RATE := 8000.0
const MAX_MIX_RATE := 192000.0
const MAX_OUTPUT_PEAK := 0.68
const OUTPUT_GAIN := 0.72
const SCATTER_AUTHORITY_GAIN := 1.06

const PARTICLE_CONTACT_SECONDS := 0.250
const SCATTER_CONTACT_SECONDS := 0.210
const PLASMA_CONTACT_SECONDS := 0.250

const CUE_IDS: Array[StringName] = [
	&"particle",
	&"ballistic_scatter",
	&"plasma",
]

const CUE_DURATIONS := {
	&"particle": 0.320,
	&"ballistic_scatter": 0.300,
	&"plasma": 0.345,
}

const CUE_CONTACTS := {
	&"particle": [PARTICLE_CONTACT_SECONDS],
	&"ballistic_scatter": [SCATTER_CONTACT_SECONDS],
	&"plasma": [PLASMA_CONTACT_SECONDS],
}

const CUE_NAMES := {
	&"particle": "PARTICLE CARBINE",
	&"ballistic_scatter": "SCATTER SHOT",
	&"plasma": "PLASMA BURST",
}

const CUE_SEEDS := {
	&"particle": 0x713A9,
	&"ballistic_scatter": 0x85C31,
	&"plasma": 0x9B4E7,
}


func supports_cue(cue_id: StringName) -> bool:
	return CUE_IDS.has(cue_id)


func cue_ids() -> Array[StringName]:
	var result: Array[StringName] = []
	result.assign(CUE_IDS)
	return result


func duration_seconds(cue_id: StringName) -> float:
	if not supports_cue(cue_id):
		push_error("Unknown ranged audio cue: %s" % cue_id)
		return 0.0
	return float(CUE_DURATIONS[cue_id])


func contacts(cue_id: StringName) -> PackedFloat32Array:
	if not supports_cue(cue_id):
		push_error("Unknown ranged audio cue: %s" % cue_id)
		return PackedFloat32Array()
	return PackedFloat32Array(CUE_CONTACTS[cue_id])


func display_name(cue_id: StringName) -> String:
	if not supports_cue(cue_id):
		push_error("Unknown ranged audio cue: %s" % cue_id)
		return ""
	return str(CUE_NAMES[cue_id])


func render_cue(
	cue_id: StringName,
	variation: Vector3,
	sequence: int,
	mix_rate: float = DEFAULT_MIX_RATE
) -> PackedVector2Array:
	if not supports_cue(cue_id):
		push_error("No ranged renderer for cue: %s" % cue_id)
		return PackedVector2Array()
	if not _is_finite_float(mix_rate) or mix_rate < MIN_MIX_RATE or mix_rate > MAX_MIX_RATE:
		push_error("Ranged cue mix rate must be finite and within 8000-192000 Hz.")
		return PackedVector2Array()
	if not _vector_is_finite(variation):
		push_error("Ranged cue variation must contain finite values.")
		return PackedVector2Array()

	var bounded_variation := Vector3(
		clampf(variation.x, 0.982, 1.018),
		clampf(variation.y, 0.95, 1.06),
		clampf(variation.z, 0.97, 1.03)
	)
	var samples := _empty_buffer(float(CUE_DURATIONS[cue_id]), mix_rate)
	match cue_id:
		&"particle":
			_render_particle(samples, bounded_variation, sequence, mix_rate)
		&"ballistic_scatter":
			_render_scatter(samples, bounded_variation, sequence, mix_rate)
			_apply_gain(samples, SCATTER_AUTHORITY_GAIN)
		&"plasma":
			_render_plasma(samples, bounded_variation, sequence, mix_rate)
	_finalize_buffer(samples)
	return samples


func _render_particle(
	samples: PackedVector2Array,
	variation: Vector3,
	sequence: int,
	mix_rate: float
) -> void:
	# Gesture/material: three dry contained packets. Each has a hard noisy launch
	# and a short, imperfect descending ion residue; the intervening notches are
	# deliberately empty so this cannot read as one smooth energy sweep.
	var starts := PackedFloat32Array([0.006, 0.047, 0.091])
	var durations := PackedFloat32Array([0.026, 0.026, 0.028])
	var gains := PackedFloat32Array([0.24, 0.21, 0.19])
	var pans := PackedFloat32Array([-0.16, 0.13, -0.04])
	for packet_index in starts.size():
		var start := starts[packet_index]
		var duration := durations[packet_index] * variation.z
		_add_band_noise(
			samples,
			_make_rng(&"particle", sequence, packet_index),
			mix_rate,
			start,
			duration,
			4300.0 * variation.y,
			6200.0 * variation.y,
			0.004,
			1350.0 * variation.y,
			2.15,
			0.0018,
			gains[packet_index],
			1.75,
			pans[packet_index],
			-pans[packet_index] * 0.35
		)
		_add_tone(
			samples,
			mix_rate,
			start + 0.001,
			duration - 0.001,
			2550.0 * variation.x,
			760.0 * variation.x,
			0.0015,
			0.075,
			1.9,
			&"unstable_packet",
			pans[packet_index] * 0.45,
			31.0,
			0.045
		)

	# Consequence: compact receiver/armor impact at the bridge's immutable
	# 250 ms projectile contact, followed by only a tiny descending ion wake.
	_add_lowpass_noise(
		samples,
		_make_rng(&"particle", sequence, 10),
		mix_rate,
		PARTICLE_CONTACT_SECONDS,
		0.058 * variation.z,
		2100.0 * variation.y,
		260.0 * variation.y,
		0.0025,
		0.43,
		1.55,
		0.0
	)
	_add_band_noise(
		samples,
		_make_rng(&"particle", sequence, 11),
		mix_rate,
		PARTICLE_CONTACT_SECONDS,
		0.054 * variation.z,
		3900.0 * variation.y,
		4700.0 * variation.y,
		0.006,
		850.0 * variation.y,
		2.0,
		0.002,
		0.25,
		1.7,
		-0.05,
		0.07
	)
	_add_tone(
		samples,
		mix_rate,
		PARTICLE_CONTACT_SECONDS,
		0.060 * variation.z,
		610.0 * variation.x,
		205.0 * variation.x,
		0.0025,
		0.16,
		1.7,
		&"dense_body",
		0.0,
		23.0,
		0.018
	)


func _render_scatter(
	samples: PackedVector2Array,
	variation: Vector3,
	sequence: int,
	mix_rate: float
) -> void:
	# Gesture/material: an immediate kinetic crack with a short mechanical body.
	# It is dry and non-tonal, leaving the projectile flight window empty.
	_add_highpass_noise(
		samples,
		_make_rng(&"ballistic_scatter", sequence, 0),
		mix_rate,
		0.004,
		0.024 * variation.z,
		720.0 * variation.y,
		3100.0 * variation.y,
		0.0015,
		0.56,
		1.45,
		-0.06
	)
	_add_lowpass_noise(
		samples,
		_make_rng(&"ballistic_scatter", sequence, 1),
		mix_rate,
		0.004,
		0.061 * variation.z,
		1800.0 * variation.y,
		135.0 * variation.y,
		0.0025,
		0.56,
		1.25,
		0.0
	)
	_add_tone(
		samples,
		mix_rate,
		0.005,
		0.057 * variation.z,
		245.0 * variation.x,
		82.0 * variation.x,
		0.002,
		0.27,
		1.5,
		&"dense_body",
		0.0,
		0.0,
		0.0
	)

	# Consequence: armor/deck body starts exactly at the authored 210 ms scatter
	# contact. Four deliberately uneven pellets arrive across 54 ms with changing
	# size and stereo placement; they are neither metronomic nor identical.
	_add_lowpass_noise(
		samples,
		_make_rng(&"ballistic_scatter", sequence, 10),
		mix_rate,
		SCATTER_CONTACT_SECONDS,
		0.068 * variation.z,
		2600.0 * variation.y,
		120.0 * variation.y,
		0.002,
		0.92,
		1.3,
		0.0
	)
	_add_tone(
		samples,
		mix_rate,
		SCATTER_CONTACT_SECONDS,
		0.066 * variation.z,
		315.0 * variation.x,
		92.0 * variation.x,
		0.002,
		0.43,
		1.35,
		&"dense_body",
		0.0,
		0.0,
		0.0
	)
	var pellet_offsets := PackedFloat32Array([0.000, 0.014, 0.031, 0.054])
	var pellet_durations := PackedFloat32Array([0.014, 0.011, 0.016, 0.012])
	var pellet_gains := PackedFloat32Array([0.58, 0.37, 0.46, 0.31])
	var pellet_pans := PackedFloat32Array([-0.42, 0.36, -0.10, 0.55])
	for pellet_index in pellet_offsets.size():
		_add_highpass_noise(
			samples,
			_make_rng(&"ballistic_scatter", sequence, 20 + pellet_index),
			mix_rate,
			SCATTER_CONTACT_SECONDS + pellet_offsets[pellet_index],
			pellet_durations[pellet_index] * variation.z,
			900.0 * variation.y,
			3400.0 * variation.y,
			0.0015,
			pellet_gains[pellet_index],
			1.4,
			pellet_pans[pellet_index]
		)


func _render_plasma(
	samples: PackedVector2Array,
	variation: Vector3,
	sequence: int,
	mix_rate: float
) -> void:
	# Gesture/material: an audible, irregular containment field occupies the
	# pre-contact flight. It is a low-mid pressure texture, not a clean sweep and
	# not the Particle Carbine's separated high packet launches.
	_add_containment_noise(
		samples,
		_make_rng(&"plasma", sequence, 0),
		mix_rate,
		0.055,
		0.188 * variation.z,
		330.0 * variation.y,
		1750.0 * variation.y,
		0.16,
		variation
	)
	_add_tone(
		samples,
		mix_rate,
		0.070,
		0.165 * variation.z,
		175.0 * variation.x,
		285.0 * variation.x,
		0.025,
		0.095,
		0.72,
		&"plasma_pressure",
		0.0,
		19.0,
		0.085
	)

	# Consequence: dense hot release at the bridge's immutable 250 ms contact.
	# Broad hot noise and a collapsing low-mid body carry weight on small speakers.
	_add_band_noise(
		samples,
		_make_rng(&"plasma", sequence, 10),
		mix_rate,
		PLASMA_CONTACT_SECONDS,
		0.081 * variation.z,
		760.0 * variation.y,
		4450.0 * variation.y,
		0.010,
		480.0 * variation.y,
		2.45,
		0.003,
		0.59,
		1.25,
		-0.08,
		0.12
	)
	_add_lowpass_noise(
		samples,
		_make_rng(&"plasma", sequence, 11),
		mix_rate,
		PLASMA_CONTACT_SECONDS,
		0.084 * variation.z,
		2450.0 * variation.y,
		230.0 * variation.y,
		0.003,
		0.62,
		1.25,
		0.0
	)
	_add_tone(
		samples,
		mix_rate,
		PLASMA_CONTACT_SECONDS,
		0.082 * variation.z,
		690.0 * variation.x,
		155.0 * variation.x,
		0.003,
		0.28,
		1.2,
		&"plasma_pressure",
		0.0,
		27.0,
		0.055
	)

	# Consequence tail: a falling thermal body plus three short, unequal sputters.
	_add_tone(
		samples,
		mix_rate,
		0.286,
		0.058 * variation.z,
		238.0 * variation.x,
		72.0 * variation.x,
		0.006,
		0.12,
		1.45,
		&"dense_body",
		0.03,
		15.0,
		0.035
	)
	var sputter_starts := PackedFloat32Array([0.294, 0.316, 0.335])
	var sputter_durations := PackedFloat32Array([0.014, 0.013, 0.009])
	var sputter_gains := PackedFloat32Array([0.18, 0.13, 0.09])
	var sputter_pans := PackedFloat32Array([0.24, -0.18, 0.09])
	for sputter_index in sputter_starts.size():
		_add_band_noise(
			samples,
			_make_rng(&"plasma", sequence, 20 + sputter_index),
			mix_rate,
			sputter_starts[sputter_index],
			sputter_durations[sputter_index] * variation.z,
			1250.0 * variation.y,
			3300.0 * variation.y,
			0.003,
			720.0 * variation.y,
			2.0,
			0.0015,
			sputter_gains[sputter_index],
			1.55,
			sputter_pans[sputter_index],
			sputter_pans[sputter_index]
		)


func _empty_buffer(duration_seconds_value: float, mix_rate: float) -> PackedVector2Array:
	var samples := PackedVector2Array()
	samples.resize(roundi(duration_seconds_value * mix_rate))
	return samples


func _make_rng(cue_id: StringName, sequence: int, lane: int) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	var base_seed := int(CUE_SEEDS[cue_id])
	rng.seed = base_seed + sequence * 104729 + lane * 13007
	return rng


func _add_containment_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	mix_rate: float,
	start_seconds: float,
	duration_seconds_value: float,
	low_cutoff: float,
	high_cutoff: float,
	peak_gain: float,
	variation: Vector3
) -> void:
	var start_frame := roundi(start_seconds * mix_rate)
	var frame_count := mini(roundi(duration_seconds_value * mix_rate), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var low_state := 0.0
	var high_state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / mix_rate
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var raw := rng.randf_range(-1.0, 1.0)
		var high_alpha := 1.0 - exp(-TAU * high_cutoff / mix_rate)
		var low_alpha := 1.0 - exp(-TAU * low_cutoff / mix_rate)
		high_state += high_alpha * (raw - high_state)
		low_state += low_alpha * (raw - low_state)
		var band := (high_state - low_state) * 1.85
		var attack := sin(clampf(elapsed / 0.025, 0.0, 1.0) * PI * 0.5)
		var release := pow(1.0 - progress, 0.35)
		var unstable_gate := 0.58 + 0.24 * sin(elapsed * TAU * 31.0 * variation.x)
		unstable_gate += 0.12 * sin(elapsed * TAU * 53.0 * variation.y + 0.8)
		var pan := sin(elapsed * TAU * 7.0) * 0.12
		_mix_mono(samples, start_frame + local_index, band * attack * release * unstable_gate * peak_gain, pan)


func _add_band_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	mix_rate: float,
	start_seconds: float,
	duration_seconds_value: float,
	start_frequency: float,
	peak_frequency: float,
	peak_time_seconds: float,
	end_frequency: float,
	bandwidth: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	pan_start: float,
	pan_end: float
) -> void:
	var start_frame := roundi(start_seconds * mix_rate)
	var frame_count := mini(roundi(duration_seconds_value * mix_rate), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var upper_state := 0.0
	var lower_state := 0.0
	var peak_ratio := clampf(peak_time_seconds / maxf(duration_seconds_value, 0.0001), 0.0, 1.0)
	for local_index in frame_count:
		var elapsed := float(local_index) / mix_rate
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var center := _three_point_frequency(
			start_frequency,
			peak_frequency,
			end_frequency,
			peak_ratio,
			progress
		)
		var upper_cutoff := minf(center * bandwidth, mix_rate * 0.44)
		var lower_cutoff := maxf(center / bandwidth, 20.0)
		var raw := rng.randf_range(-1.0, 1.0)
		var upper_alpha := 1.0 - exp(-TAU * upper_cutoff / mix_rate)
		var lower_alpha := 1.0 - exp(-TAU * lower_cutoff / mix_rate)
		upper_state += upper_alpha * (raw - upper_state)
		lower_state += lower_alpha * (raw - lower_state)
		var band := (upper_state - lower_state) * 1.75
		var envelope := _attack_decay_envelope(elapsed, duration_seconds_value, attack_seconds, decay_power)
		_mix_mono(
			samples,
			start_frame + local_index,
			band * envelope * peak_gain,
			lerpf(pan_start, pan_end, progress)
		)


func _add_lowpass_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	mix_rate: float,
	start_seconds: float,
	duration_seconds_value: float,
	start_cutoff: float,
	end_cutoff: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	pan: float
) -> void:
	var start_frame := roundi(start_seconds * mix_rate)
	var frame_count := mini(roundi(duration_seconds_value * mix_rate), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / mix_rate
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var cutoff := _exp_lerp(start_cutoff, end_cutoff, progress)
		var alpha := 1.0 - exp(-TAU * cutoff / mix_rate)
		state += alpha * (rng.randf_range(-1.0, 1.0) - state)
		var envelope := _attack_decay_envelope(elapsed, duration_seconds_value, attack_seconds, decay_power)
		_mix_mono(samples, start_frame + local_index, state * 2.0 * envelope * peak_gain, pan)


func _add_highpass_noise(
	samples: PackedVector2Array,
	rng: RandomNumberGenerator,
	mix_rate: float,
	start_seconds: float,
	duration_seconds_value: float,
	start_cutoff: float,
	end_cutoff: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	pan: float
) -> void:
	var start_frame := roundi(start_seconds * mix_rate)
	var frame_count := mini(roundi(duration_seconds_value * mix_rate), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var low_state := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / mix_rate
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var cutoff := _exp_lerp(start_cutoff, end_cutoff, progress)
		var alpha := 1.0 - exp(-TAU * cutoff / mix_rate)
		var raw := rng.randf_range(-1.0, 1.0)
		low_state += alpha * (raw - low_state)
		var high := (raw - low_state) * 0.72
		var envelope := _attack_decay_envelope(elapsed, duration_seconds_value, attack_seconds, decay_power)
		_mix_mono(samples, start_frame + local_index, high * envelope * peak_gain, pan)


func _add_tone(
	samples: PackedVector2Array,
	mix_rate: float,
	start_seconds: float,
	duration_seconds_value: float,
	start_frequency: float,
	end_frequency: float,
	attack_seconds: float,
	peak_gain: float,
	decay_power: float,
	waveform: StringName,
	pan: float,
	wobble_rate: float,
	wobble_depth: float
) -> void:
	var start_frame := roundi(start_seconds * mix_rate)
	var frame_count := mini(roundi(duration_seconds_value * mix_rate), samples.size() - start_frame)
	if frame_count <= 0:
		return
	var phase := 0.0
	for local_index in frame_count:
		var elapsed := float(local_index) / mix_rate
		var progress := float(local_index) / maxf(1.0, float(frame_count - 1))
		var wobble := 1.0 + sin(elapsed * TAU * wobble_rate) * wobble_depth
		var frequency := _exp_lerp(start_frequency, end_frequency, progress) * wobble
		phase = fmod(phase + TAU * frequency / mix_rate, TAU)
		var value := _waveform_sample(waveform, phase, elapsed)
		var envelope := _attack_decay_envelope(elapsed, duration_seconds_value, attack_seconds, decay_power)
		_mix_mono(samples, start_frame + local_index, value * envelope * peak_gain, pan)


func _waveform_sample(waveform: StringName, phase: float, elapsed: float) -> float:
	match waveform:
		&"dense_body":
			return sin(phase) + 0.24 * sin(phase * 2.03)
		&"unstable_packet":
			return sin(phase) * 0.58 + sin(phase * 2.17 + elapsed * 41.0) * 0.27 + sin(phase * 3.71) * 0.15
		&"plasma_pressure":
			return sin(phase) * 0.62 + sin(phase * 1.41 + elapsed * 29.0) * 0.25 + sin(phase * 0.53) * 0.13
		_:
			return sin(phase)


func _mix_mono(samples: PackedVector2Array, index: int, value: float, pan: float) -> void:
	if index < 0 or index >= samples.size():
		return
	var angle := (clampf(pan, -1.0, 1.0) + 1.0) * PI * 0.25
	var stereo := Vector2(value * cos(angle), value * sin(angle))
	samples[index] = samples[index] + stereo


func _attack_decay_envelope(
	elapsed: float,
	duration_seconds_value: float,
	attack_seconds: float,
	decay_power: float
) -> float:
	if elapsed < 0.0 or elapsed >= duration_seconds_value:
		return 0.0
	if attack_seconds > 0.0 and elapsed < attack_seconds:
		return sin((elapsed / attack_seconds) * PI * 0.5)
	var decay_duration := maxf(0.0001, duration_seconds_value - attack_seconds)
	var decay_progress := clampf((elapsed - attack_seconds) / decay_duration, 0.0, 1.0)
	return pow(1.0 - decay_progress, decay_power)


func _three_point_frequency(
	start_frequency: float,
	peak_frequency: float,
	end_frequency: float,
	peak_ratio: float,
	progress: float
) -> float:
	if peak_ratio <= 0.0:
		return _exp_lerp(peak_frequency, end_frequency, progress)
	if progress <= peak_ratio:
		return _exp_lerp(start_frequency, peak_frequency, progress / peak_ratio)
	return _exp_lerp(
		peak_frequency,
		end_frequency,
		(progress - peak_ratio) / maxf(0.0001, 1.0 - peak_ratio)
	)


func _exp_lerp(start_value: float, end_value: float, weight: float) -> float:
	var safe_start := maxf(0.001, start_value)
	var safe_end := maxf(0.001, end_value)
	return safe_start * pow(safe_end / safe_start, clampf(weight, 0.0, 1.0))


func _finalize_buffer(samples: PackedVector2Array) -> void:
	var peak := 0.0
	for index in samples.size():
		var frame := samples[index] * OUTPUT_GAIN
		frame.x = _soft_limit(frame.x)
		frame.y = _soft_limit(frame.y)
		samples[index] = frame
		peak = maxf(peak, maxf(absf(frame.x), absf(frame.y)))
	if peak <= MAX_OUTPUT_PEAK:
		return
	var scale := MAX_OUTPUT_PEAK / peak
	for index in samples.size():
		samples[index] = samples[index] * scale


func _apply_gain(samples: PackedVector2Array, gain: float) -> void:
	for index in samples.size():
		samples[index] = samples[index] * gain


func _soft_limit(value: float) -> float:
	return value / (1.0 + absf(value) * 0.38)


func _is_finite_float(value: float) -> bool:
	return not is_nan(value) and not is_inf(value)


func _vector_is_finite(value: Vector3) -> bool:
	return _is_finite_float(value.x) and _is_finite_float(value.y) and _is_finite_float(value.z)
