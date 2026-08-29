class_name WebGameCoreClient
extends RefCounted

const BridgeLoader = preload("res://scripts/presentation_bridge_loader.gd")
const LIVE_SESSION_FORMAT := "deathstalker-core-session"
const LIVE_SESSION_PROTOCOL_VERSION := 1
const RESULT_TYPES: Array[String] = [
	"session_created",
	"action_applied",
	"ai_action_applied",
	"session_restarted",
]
const AWAITING_TYPES: Array[String] = ["player", "ai", "complete"]
const OPENING_SESSION_FORMAT := "deathstalker-opening-expedition-session"
const OPENING_SESSION_PROTOCOL_VERSION := 3
const OPENING_SCENARIO_ID := "opening_virimonde_forced_departure"
const OPENING_RESULT_TYPES: Array[String] = [
	"expedition_created",
	"expedition_resumed",
	"beat_advanced",
	"exploration_completed",
	"field_contact_started",
	"field_contact_cleared",
	"action_applied",
	"ai_action_applied",
	"recovery_chosen",
	"expedition_restarted",
]
const OPENING_AWAITING_TYPES: Array[String] = [
	"continue",
	"field_return",
	"player",
	"ai",
	"choice",
	"complete",
	"failed",
]
const WORLD_LOOP_SESSION_FORMAT := "deathstalker-world-loop-session"
const WORLD_LOOP_SCENARIO_ID := "world_loop_proving_fixture"
const WORLD_LOOP_RESULT_TYPES: Array[String] = [
	"world_loop_created",
	"world_loop_resumed",
	"location_changed",
	"chest_opened",
	"party_rested",
	"shop_purchase_completed",
	"encounter_started",
	"action_applied",
	"ai_action_applied",
	"battle_returned_to_map",
	"world_loop_restarted",
]
const WORLD_LOOP_AWAITING_TYPES: Array[String] = [
	"explore",
	"player",
	"ai",
	"return",
	"complete",
	"failed",
]

var _api: Variant = null
var last_error := ""
var last_request_ms := 0.0
var request_count := 0
var opening_persistence_available := false
var opening_checkpoint_found := false
var opening_checkpoint_sequence := -1
var world_loop_persistence_available := false
var world_loop_checkpoint_found := false
var world_loop_checkpoint_sequence := -1


func connect_host() -> bool:
	last_error = ""
	if not OS.has_feature("web"):
		last_error = "The JavaScript core host is available only in a Godot Web export."
		return false
	if not Engine.has_singleton("JavaScriptBridge"):
		last_error = "Godot Web export does not expose JavaScriptBridge."
		return false
	var javascript_bridge: Object = Engine.get_singleton("JavaScriptBridge")
	_api = javascript_bridge.call("get_interface", "DeathstalkerCore")
	if _api == null:
		last_error = "DeathstalkerCore JavaScript host was not loaded before Godot startup."
		return false
	return true


func request(payload: Dictionary) -> Dictionary:
	last_error = ""
	if _api == null and not connect_host():
		return {}
	var started_usec := Time.get_ticks_usec()
	var response_json: Variant = _api.handle(JSON.stringify(payload))
	last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
	request_count += 1
	if typeof(response_json) != TYPE_STRING:
		last_error = "DeathstalkerCore returned a non-string response."
		return {}
	var response: Variant = JSON.parse_string(str(response_json))
	if typeof(response) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore returned malformed JSON."
		return {}
	var envelope := response as Dictionary
	if not _valid_envelope(envelope):
		return {}
	return envelope


func request_opening(payload: Dictionary) -> Dictionary:
	last_error = ""
	if _api == null and not connect_host():
		return {}
	var started_usec := Time.get_ticks_usec()
	var response_json: Variant = _api.handleOpeningExpedition(JSON.stringify(payload))
	last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
	request_count += 1
	if typeof(response_json) != TYPE_STRING:
		last_error = "DeathstalkerCore returned a non-string opening response."
		return {}
	var response: Variant = JSON.parse_string(str(response_json))
	if typeof(response) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore returned malformed opening JSON."
		return {}
	var envelope := response as Dictionary
	if not _valid_opening_envelope(envelope):
		return {}
	_refresh_opening_persistence_status(str(payload.get("sessionId", "")))
	return envelope


func request_world_loop(payload: Dictionary) -> Dictionary:
	last_error = ""
	if _api == null and not connect_host():
		return {}
	var started_usec := Time.get_ticks_usec()
	var response_json: Variant = _api.handleWorldLoop(JSON.stringify(payload))
	last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
	request_count += 1
	if typeof(response_json) != TYPE_STRING:
		last_error = "DeathstalkerCore returned a non-string world-loop response."
		return {}
	var response: Variant = JSON.parse_string(str(response_json))
	if typeof(response) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore returned malformed world-loop JSON."
		return {}
	var envelope := response as Dictionary
	if not _valid_world_loop_envelope(envelope):
		return {}
	_refresh_world_loop_persistence_status(str(payload.get("sessionId", "")))
	return envelope


func resume_world_loop(session_id: String) -> Dictionary:
	last_error = ""
	if _api == null and not connect_host():
		return {}
	var started_usec := Time.get_ticks_usec()
	var response_json: Variant = _api.resumeWorldLoop(session_id)
	last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
	request_count += 1
	if typeof(response_json) != TYPE_STRING:
		last_error = "DeathstalkerCore returned a non-string world-loop resume response."
		return {}
	var response: Variant = JSON.parse_string(str(response_json))
	if typeof(response) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore returned malformed world-loop resume JSON."
		return {}
	var envelope := response as Dictionary
	if not _valid_world_loop_envelope(envelope):
		return {}
	_refresh_world_loop_persistence_status(session_id)
	return envelope


func save_world_loop_position(
	session_id: String,
	sequence: int,
	location_id: String,
	position: Vector2
) -> bool:
	if _api == null and not connect_host():
		return false
	if session_id.strip_edges().is_empty() or location_id.strip_edges().is_empty() or sequence < 0:
		return false
	var checkpoint := {
		"format": "deathstalker-world-loop-presentation-checkpoint",
		"checkpointVersion": 1,
		"sequence": sequence,
		"locationId": location_id,
		"position": {"x": position.x, "y": position.y},
	}
	var saved: Variant = _api.saveWorldLoopPresentationState(session_id, JSON.stringify(checkpoint))
	return typeof(saved) == TYPE_BOOL and bool(saved)


func load_world_loop_position(session_id: String) -> Dictionary:
	if _api == null and not connect_host():
		return {}
	var state_json: Variant = _api.loadWorldLoopPresentationState(session_id)
	if typeof(state_json) != TYPE_STRING:
		return {}
	var state_value: Variant = JSON.parse_string(str(state_json))
	if typeof(state_value) != TYPE_DICTIONARY:
		return {}
	var state := state_value as Dictionary
	if not _has_exact_keys(state, [
		"format", "checkpointVersion", "sequence", "locationId", "position"
	]):
		return {}
	if (
		str(state.get("format", "")) != "deathstalker-world-loop-presentation-checkpoint"
		or typeof(state.get("checkpointVersion")) != TYPE_FLOAT
		or int(state.get("checkpointVersion", 0)) != 1
		or typeof(state.get("sequence")) != TYPE_FLOAT
		or int(state.get("sequence", -1)) < 0
		or str(state.get("locationId", "")).strip_edges().is_empty()
	):
		return {}
	var position_value: Variant = state.get("position")
	if typeof(position_value) != TYPE_DICTIONARY:
		return {}
	var point := position_value as Dictionary
	if (
		not _has_exact_keys(point, ["x", "y"])
		or typeof(point.get("x")) != TYPE_FLOAT
		or typeof(point.get("y")) != TYPE_FLOAT
	):
		return {}
	return state.duplicate(true)


func _refresh_world_loop_persistence_status(session_id: String) -> void:
	world_loop_persistence_available = false
	world_loop_checkpoint_found = false
	world_loop_checkpoint_sequence = -1
	if _api == null or session_id.strip_edges().is_empty():
		return
	var status_json: Variant = _api.getWorldLoopPersistenceStatus(session_id)
	if typeof(status_json) != TYPE_STRING:
		return
	var status_value: Variant = JSON.parse_string(str(status_json))
	if typeof(status_value) != TYPE_DICTIONARY:
		return
	var status := status_value as Dictionary
	if not _has_exact_keys(status, ["available", "checkpointFound", "sequence"]):
		return
	if typeof(status.get("available")) != TYPE_BOOL or typeof(status.get("checkpointFound")) != TYPE_BOOL:
		return
	var sequence_value: Variant = status.get("sequence")
	if sequence_value != null and typeof(sequence_value) != TYPE_FLOAT:
		return
	world_loop_persistence_available = bool(status.get("available", false))
	world_loop_checkpoint_found = bool(status.get("checkpointFound", false))
	world_loop_checkpoint_sequence = int(sequence_value) if sequence_value != null else -1


func _valid_world_loop_envelope(envelope: Dictionary) -> bool:
	last_error = ""
	if str(envelope.get("format", "")) != WORLD_LOOP_SESSION_FORMAT:
		last_error = "DeathstalkerCore world-loop response format is unsupported."
		return false
	if typeof(envelope.get("protocolVersion")) != TYPE_FLOAT or int(envelope.get("protocolVersion")) != 3:
		last_error = "DeathstalkerCore world-loop protocol version is unsupported."
		return false
	if typeof(envelope.get("ok")) != TYPE_BOOL:
		last_error = "DeathstalkerCore world-loop response is missing a Boolean ok field."
		return false
	if not bool(envelope.get("ok")):
		return _valid_world_loop_error(envelope)
	if not _has_exact_keys(envelope, [
		"format", "protocolVersion", "ok", "requestId", "sessionId", "sequence", "resultType", "view"
	]):
		last_error = "DeathstalkerCore world-loop success response has unexpected fields."
		return false
	if not WORLD_LOOP_RESULT_TYPES.has(str(envelope.get("resultType", ""))):
		last_error = "DeathstalkerCore world-loop result type is unsupported."
		return false
	if typeof(envelope.get("sequence")) != TYPE_FLOAT:
		last_error = "DeathstalkerCore world-loop response sequence is invalid."
		return false
	var sequence := int(envelope.get("sequence", -1))
	var view_value: Variant = envelope.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop response is missing its view."
		return false
	var view := view_value as Dictionary
	if not _has_exact_keys(view, [
		"scenarioId", "seed", "sequence", "awaiting", "explorationAvatar", "location", "interactables", "campaign",
		"party", "openedChestIds", "encounterVictoryCounts", "restCount", "bossDefeated",
		"fieldContactAdvantage", "lastEvent", "encounter", "transition", "legalActions"
	]):
		last_error = "DeathstalkerCore world-loop view has unexpected fields."
		return false
	if not _nonempty_string(view.get("scenarioId")) or int(view.get("sequence", -1)) != sequence:
		last_error = "DeathstalkerCore world-loop view identity or sequence is invalid."
		return false
	if not WORLD_LOOP_AWAITING_TYPES.has(str(view.get("awaiting", ""))):
		last_error = "DeathstalkerCore world-loop awaiting state is unsupported."
		return false
	var advantage: Variant = view.get("fieldContactAdvantage")
	if advantage != null and not ["player", "enemy", "normal"].has(str(advantage)):
		last_error = "DeathstalkerCore world-loop field-contact advantage is unsupported."
		return false
	if not _valid_world_loop_avatar(view.get("explorationAvatar")):
		return false
	if not _valid_world_loop_location(view.get("location")):
		return false
	if not _valid_world_loop_interactables(view.get("interactables")):
		return false
	if not _valid_world_loop_campaign(view.get("campaign")):
		return false
	if not _valid_world_loop_party(view.get("party")):
		return false
	if typeof(view.get("openedChestIds")) != TYPE_ARRAY or typeof(view.get("encounterVictoryCounts")) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop progress collections are malformed."
		return false
	if (
		typeof(view.get("restCount")) != TYPE_FLOAT
		or int(view.get("restCount", -1)) < 0
		or typeof(view.get("bossDefeated")) != TYPE_BOOL
		or typeof(view.get("lastEvent")) != TYPE_STRING
	):
		last_error = "DeathstalkerCore world-loop progress fields are malformed."
		return false
	return _valid_world_loop_combat(view)


func _valid_world_loop_error(envelope: Dictionary) -> bool:
	if not _has_exact_keys(
		envelope,
		["format", "protocolVersion", "ok", "requestId", "sessionId", "sequence", "error"]
	):
		last_error = "DeathstalkerCore world-loop error response has unexpected fields."
		return false
	var error_value: Variant = envelope.get("error")
	if typeof(error_value) != TYPE_DICTIONARY or not _has_exact_keys(error_value as Dictionary, ["code", "message"]):
		last_error = "DeathstalkerCore world-loop error response is malformed."
		return false
	var error := error_value as Dictionary
	last_error = "%s: %s" % [str(error.get("code", "unknown_error")), str(error.get("message", ""))]
	return true


func _valid_world_loop_location(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop location is malformed."
		return false
	var location := value as Dictionary
	if not _has_exact_keys(location, [
		"id", "kind", "connectedLocationIds", "restAvailable", "shopAvailable", "map"
	]):
		last_error = "DeathstalkerCore world-loop location has unexpected fields."
		return false
	if (
		not _nonempty_string(location.get("id"))
		or not ["town", "field", "boss_approach"].has(str(location.get("kind", "")))
		or typeof(location.get("connectedLocationIds")) != TYPE_ARRAY
		or typeof(location.get("restAvailable")) != TYPE_BOOL
		or typeof(location.get("shopAvailable")) != TYPE_BOOL
	):
		last_error = "DeathstalkerCore world-loop location fields are malformed."
		return false
	return _valid_world_loop_map(location.get("map"))


func _valid_world_loop_avatar(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop exploration avatar is malformed."
		return false
	var avatar := value as Dictionary
	if not _has_exact_keys(avatar, ["id", "name"]):
		last_error = "DeathstalkerCore world-loop exploration avatar has unexpected fields."
		return false
	if not _nonempty_string(avatar.get("id")) or not _nonempty_string(avatar.get("name")):
		last_error = "DeathstalkerCore world-loop exploration avatar fields are malformed."
		return false
	return true


func _valid_world_loop_point(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		return false
	var point := value as Dictionary
	return (
		_has_exact_keys(point, ["x", "y"])
		and typeof(point.get("x")) == TYPE_FLOAT
		and typeof(point.get("y")) == TYPE_FLOAT
		and is_finite(float(point.get("x", 0.0)))
		and is_finite(float(point.get("y", 0.0)))
	)


func _valid_world_loop_route(value: Variant, minimum_points: int) -> bool:
	if typeof(value) != TYPE_ARRAY or (value as Array).size() < minimum_points:
		return false
	for point_value: Variant in value as Array:
		if not _valid_world_loop_point(point_value):
			return false
	return true


func _valid_world_loop_map(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop map is malformed."
		return false
	var map := value as Dictionary
	if not _has_exact_keys(map, [
		"bounds", "defaultEntryPosition", "entryPoints", "walkableAreas", "mainRoute",
		"secondaryRoutes", "interactablePlacements"
	]):
		last_error = "DeathstalkerCore world-loop map has unexpected fields."
		return false
	var bounds_value: Variant = map.get("bounds")
	if typeof(bounds_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop map bounds are malformed."
		return false
	var bounds := bounds_value as Dictionary
	if not _has_exact_keys(bounds, ["minX", "minY", "maxX", "maxY"]):
		last_error = "DeathstalkerCore world-loop map bounds have unexpected fields."
		return false
	for key in ["minX", "minY", "maxX", "maxY"]:
		if typeof(bounds.get(key)) != TYPE_FLOAT or not is_finite(float(bounds.get(key, 0.0))):
			last_error = "DeathstalkerCore world-loop map bounds are invalid."
			return false
	if (
		float(bounds.get("minX", 0.0)) >= float(bounds.get("maxX", 0.0))
		or float(bounds.get("minY", 0.0)) >= float(bounds.get("maxY", 0.0))
		or not _valid_world_loop_point(map.get("defaultEntryPosition"))
		or typeof(map.get("entryPoints")) != TYPE_ARRAY
		or typeof(map.get("walkableAreas")) != TYPE_ARRAY
		or not _valid_world_loop_route(map.get("mainRoute"), 2)
		or typeof(map.get("secondaryRoutes")) != TYPE_ARRAY
		or typeof(map.get("interactablePlacements")) != TYPE_ARRAY
	):
		last_error = "DeathstalkerCore world-loop map fields are malformed."
		return false
	for entry_value: Variant in map.get("entryPoints", []) as Array:
		if typeof(entry_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore world-loop entry point is malformed."
			return false
		var entry := entry_value as Dictionary
		if (
			not _has_exact_keys(entry, ["sourceLocationId", "position"])
			or not _nonempty_string(entry.get("sourceLocationId"))
			or not _valid_world_loop_point(entry.get("position"))
		):
			last_error = "DeathstalkerCore world-loop entry point fields are malformed."
			return false
	var walkable_areas := map.get("walkableAreas", []) as Array
	if walkable_areas.is_empty():
		last_error = "DeathstalkerCore world-loop map has no walkable area."
		return false
	for area_value: Variant in walkable_areas:
		if typeof(area_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore world-loop walkable area is malformed."
			return false
		var area := area_value as Dictionary
		if not _has_exact_keys(area, ["x", "y", "width", "height"]):
			last_error = "DeathstalkerCore world-loop walkable area has unexpected fields."
			return false
		for key in ["x", "y", "width", "height"]:
			if typeof(area.get(key)) != TYPE_FLOAT or not is_finite(float(area.get(key, 0.0))):
				last_error = "DeathstalkerCore world-loop walkable area fields are malformed."
				return false
		if float(area.get("width", 0.0)) <= 0.0 or float(area.get("height", 0.0)) <= 0.0:
			last_error = "DeathstalkerCore world-loop walkable area size is invalid."
			return false
	for route_value: Variant in map.get("secondaryRoutes", []) as Array:
		if not _valid_world_loop_route(route_value, 2):
			last_error = "DeathstalkerCore world-loop secondary route is malformed."
			return false
	for placement_value: Variant in map.get("interactablePlacements", []) as Array:
		if typeof(placement_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore world-loop placement is malformed."
			return false
		var placement := placement_value as Dictionary
		if (
			not _has_exact_keys(placement, ["interactableId", "position", "markerVisibility"])
			or not _nonempty_string(placement.get("interactableId"))
			or not _valid_world_loop_point(placement.get("position"))
			or not ["always", "nearby"].has(str(placement.get("markerVisibility", "")))
		):
			last_error = "DeathstalkerCore world-loop placement fields are malformed."
			return false
	return true


func _valid_world_loop_interactables(value: Variant) -> bool:
	if typeof(value) != TYPE_ARRAY:
		last_error = "DeathstalkerCore world-loop interactables are malformed."
		return false
	for interactable_value: Variant in value as Array:
		if typeof(interactable_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore world-loop interactable is malformed."
			return false
		var interactable := interactable_value as Dictionary
		if not _has_exact_keys(interactable, [
			"id", "type", "label", "available", "detail", "position", "markerVisibility",
			"fieldContact"
		]):
			last_error = "DeathstalkerCore world-loop interactable has unexpected fields."
			return false
		var contact_value: Variant = interactable.get("fieldContact")
		if str(interactable.get("type", "")) == "encounter":
			if typeof(contact_value) != TYPE_DICTIONARY:
				last_error = "DeathstalkerCore world-loop encounter has no field-contact geometry."
				return false
			var contact := contact_value as Dictionary
			if not _has_exact_keys(contact, [
				"facing", "awarenessRange", "awarenessHalfAngleDegrees", "fieldStrikeRange",
				"collisionRadius"
			]):
				last_error = "DeathstalkerCore world-loop field-contact geometry has unexpected fields."
				return false
			if not _valid_world_loop_point(contact.get("facing")):
				last_error = "DeathstalkerCore world-loop field-contact facing is malformed."
				return false
			var facing := contact.get("facing", {}) as Dictionary
			if Vector2(float(facing.get("x", 0.0)), float(facing.get("y", 0.0))).is_zero_approx():
				last_error = "DeathstalkerCore world-loop field-contact facing is zero."
				return false
			for number_key in [
				"awarenessRange", "awarenessHalfAngleDegrees", "fieldStrikeRange", "collisionRadius"
			]:
				if (
					typeof(contact.get(number_key)) != TYPE_FLOAT
					or not is_finite(float(contact.get(number_key, 0.0)))
					or float(contact.get(number_key, 0.0)) <= 0.0
				):
					last_error = "DeathstalkerCore world-loop field-contact ranges are malformed."
					return false
			if (
				float(contact.get("awarenessHalfAngleDegrees", 0.0)) > 180.0
				or float(contact.get("awarenessRange", 0.0)) < float(contact.get("collisionRadius", 0.0))
				or float(contact.get("fieldStrikeRange", 0.0)) < float(contact.get("collisionRadius", 0.0))
			):
				last_error = "DeathstalkerCore world-loop field-contact geometry is invalid."
				return false
		elif contact_value != null:
			last_error = "DeathstalkerCore non-encounter interactable exposed field-contact geometry."
			return false
		if (
			not _nonempty_string(interactable.get("id"))
			or not ["travel", "chest", "encounter", "rest", "shop"].has(str(interactable.get("type", "")))
			or not _nonempty_string(interactable.get("label"))
			or typeof(interactable.get("available")) != TYPE_BOOL
			or typeof(interactable.get("detail")) != TYPE_STRING
			or not _valid_world_loop_point(interactable.get("position"))
			or not ["always", "nearby"].has(str(interactable.get("markerVisibility", "")))
		):
			last_error = "DeathstalkerCore world-loop interactable fields are malformed."
			return false
	return true


func _valid_world_loop_campaign(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop campaign state is malformed."
		return false
	var campaign := value as Dictionary
	if not _has_exact_keys(campaign, ["partyLevel", "xp", "nextLevelXp", "gold", "inventory"]):
		last_error = "DeathstalkerCore world-loop campaign state has unexpected fields."
		return false
	var inventory_value: Variant = campaign.get("inventory")
	if typeof(inventory_value) != TYPE_DICTIONARY or not _has_exact_keys(inventory_value as Dictionary, ["medkits", "revives"]):
		last_error = "DeathstalkerCore world-loop inventory is malformed."
		return false
	for number_key in ["partyLevel", "xp", "gold"]:
		if typeof(campaign.get(number_key)) != TYPE_FLOAT or int(campaign.get(number_key, -1)) < 0:
			last_error = "DeathstalkerCore world-loop campaign numbers are malformed."
			return false
	var next_level: Variant = campaign.get("nextLevelXp")
	if next_level != null and (typeof(next_level) != TYPE_FLOAT or int(next_level) < 0):
		last_error = "DeathstalkerCore world-loop next level threshold is malformed."
		return false
	var inventory := inventory_value as Dictionary
	if typeof(inventory.get("medkits")) != TYPE_FLOAT or typeof(inventory.get("revives")) != TYPE_FLOAT:
		last_error = "DeathstalkerCore world-loop inventory counts are malformed."
		return false
	return int(inventory.get("medkits", -1)) >= 0 and int(inventory.get("revives", -1)) >= 0


func _valid_world_loop_party(value: Variant) -> bool:
	if typeof(value) != TYPE_ARRAY or (value as Array).is_empty():
		last_error = "DeathstalkerCore world-loop party is malformed."
		return false
	for member_value: Variant in value as Array:
		if typeof(member_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore world-loop party member is malformed."
			return false
		var member := member_value as Dictionary
		if not _has_exact_keys(member, ["id", "name", "role", "hp", "maxHp"]):
			last_error = "DeathstalkerCore world-loop party member has unexpected fields."
			return false
		if (
			not _nonempty_string(member.get("id"))
			or not _nonempty_string(member.get("name"))
			or not _nonempty_string(member.get("role"))
			or typeof(member.get("hp")) != TYPE_FLOAT
			or typeof(member.get("maxHp")) != TYPE_FLOAT
			or float(member.get("hp", -1.0)) < 0.0
			or float(member.get("hp", 0.0)) > float(member.get("maxHp", 0.0))
		):
			last_error = "DeathstalkerCore world-loop party member fields are malformed."
			return false
	return true


func _valid_world_loop_combat(view: Dictionary) -> bool:
	var awaiting := str(view.get("awaiting", ""))
	var encounter_value: Variant = view.get("encounter")
	var transition_value: Variant = view.get("transition")
	var legal_actions_value: Variant = view.get("legalActions")
	if typeof(legal_actions_value) != TYPE_ARRAY:
		last_error = "DeathstalkerCore world-loop legal actions are malformed."
		return false
	var legal_actions := legal_actions_value as Array
	if awaiting == "explore" or awaiting == "complete":
		if (
			encounter_value != null
			or transition_value != null
			or not legal_actions.is_empty()
			or view.get("fieldContactAdvantage") != null
		):
			last_error = "DeathstalkerCore world-loop exploration view exposed combat data."
			return false
		return true
	if typeof(encounter_value) != TYPE_DICTIONARY or typeof(transition_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore world-loop combat view is missing encounter or transition data."
		return false
	if view.get("fieldContactAdvantage") == null:
		last_error = "DeathstalkerCore world-loop combat omitted its field-contact advantage."
		return false
	var loader := BridgeLoader.new()
	if not loader.validate_live_transition(encounter_value as Dictionary, transition_value as Dictionary):
		last_error = "DeathstalkerCore world-loop transition failed presentation validation: %s" % "; ".join(loader.get_errors())
		return false
	if awaiting != "player" and not legal_actions.is_empty():
		last_error = "DeathstalkerCore world-loop exposed player legal actions outside a player turn."
		return false
	if awaiting == "player" and legal_actions.is_empty():
		last_error = "DeathstalkerCore world-loop player turn exposed no legal actions."
		return false
	var state := (transition_value as Dictionary).get("state", {}) as Dictionary
	var active_actor_id := str(state.get("activeActorId", ""))
	var combatant_ids: Array[String] = []
	for combatant_value: Variant in state.get("combatants", []) as Array:
		if typeof(combatant_value) == TYPE_DICTIONARY:
			combatant_ids.append(str((combatant_value as Dictionary).get("id", "")))
	for action_value: Variant in legal_actions:
		if typeof(action_value) != TYPE_DICTIONARY or not _valid_legal_action(
			action_value as Dictionary,
			active_actor_id,
			combatant_ids
		):
			last_error = "DeathstalkerCore world-loop legal action is malformed."
			return false
	return true


func resume_opening(session_id: String) -> Dictionary:
	last_error = ""
	if _api == null and not connect_host():
		return {}
	var started_usec := Time.get_ticks_usec()
	var response_json: Variant = _api.resumeOpeningExpedition(session_id)
	last_request_ms = float(Time.get_ticks_usec() - started_usec) / 1000.0
	request_count += 1
	if typeof(response_json) != TYPE_STRING:
		last_error = "DeathstalkerCore returned a non-string opening resume response."
		return {}
	var response: Variant = JSON.parse_string(str(response_json))
	if typeof(response) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore returned malformed opening resume JSON."
		return {}
	var envelope := response as Dictionary
	if not _valid_opening_envelope(envelope):
		return {}
	_refresh_opening_persistence_status(session_id)
	return envelope


func save_opening_position(
	session_id: String,
	sequence: int,
	beat_id: String,
	map_id: String,
	position: Vector2,
	supplies_inspected: bool
) -> bool:
	if _api == null and not connect_host():
		return false
	if (
		session_id.strip_edges().is_empty()
		or beat_id.strip_edges().is_empty()
		or map_id.strip_edges().is_empty()
		or sequence < 0
	):
		return false
	var checkpoint := {
		"format": "deathstalker-opening-exploration-presentation-checkpoint",
		"checkpointVersion": 1,
		"sequence": sequence,
		"beatId": beat_id,
		"mapId": map_id,
		"position": {"x": position.x, "y": position.y},
		"suppliesInspected": supplies_inspected,
	}
	var saved: Variant = _api.saveOpeningPresentationState(
		session_id,
		JSON.stringify(checkpoint)
	)
	return typeof(saved) == TYPE_BOOL and bool(saved)


func load_opening_position(session_id: String) -> Dictionary:
	if _api == null and not connect_host():
		return {}
	var state_json: Variant = _api.loadOpeningPresentationState(session_id)
	if typeof(state_json) != TYPE_STRING:
		return {}
	var state_value: Variant = JSON.parse_string(str(state_json))
	if typeof(state_value) != TYPE_DICTIONARY:
		return {}
	var state := state_value as Dictionary
	if not _has_exact_keys(state, [
		"format", "checkpointVersion", "sequence", "beatId", "mapId", "position",
		"suppliesInspected"
	]):
		return {}
	if (
		str(state.get("format", "")) != "deathstalker-opening-exploration-presentation-checkpoint"
		or typeof(state.get("checkpointVersion")) != TYPE_FLOAT
		or int(state.get("checkpointVersion", 0)) != 1
		or typeof(state.get("sequence")) != TYPE_FLOAT
		or int(state.get("sequence", -1)) < 0
		or str(state.get("beatId", "")).strip_edges().is_empty()
		or str(state.get("mapId", "")).strip_edges().is_empty()
		or typeof(state.get("suppliesInspected")) != TYPE_BOOL
	):
		return {}
	var position_value: Variant = state.get("position")
	if typeof(position_value) != TYPE_DICTIONARY:
		return {}
	var point := position_value as Dictionary
	if (
		not _has_exact_keys(point, ["x", "y"])
		or typeof(point.get("x")) != TYPE_FLOAT
		or typeof(point.get("y")) != TYPE_FLOAT
		or not is_finite(float(point.get("x", 0.0)))
		or not is_finite(float(point.get("y", 0.0)))
	):
		return {}
	return state.duplicate(true)


func _refresh_opening_persistence_status(session_id: String) -> void:
	opening_persistence_available = false
	opening_checkpoint_found = false
	opening_checkpoint_sequence = -1
	if _api == null or session_id.strip_edges().is_empty():
		return
	var status_json: Variant = _api.getOpeningPersistenceStatus(session_id)
	if typeof(status_json) != TYPE_STRING:
		return
	var status_value: Variant = JSON.parse_string(str(status_json))
	if typeof(status_value) != TYPE_DICTIONARY:
		return
	var status := status_value as Dictionary
	if not _has_exact_keys(status, ["available", "checkpointFound", "sequence"]):
		return
	if typeof(status.get("available")) != TYPE_BOOL or typeof(status.get("checkpointFound")) != TYPE_BOOL:
		return
	var sequence_value: Variant = status.get("sequence")
	if sequence_value != null and typeof(sequence_value) != TYPE_FLOAT:
		return
	opening_persistence_available = bool(status.get("available", false))
	opening_checkpoint_found = bool(status.get("checkpointFound", false))
	opening_checkpoint_sequence = int(sequence_value) if sequence_value != null else -1


func _valid_opening_envelope(envelope: Dictionary) -> bool:
	last_error = ""
	if str(envelope.get("format", "")) != OPENING_SESSION_FORMAT:
		last_error = "DeathstalkerCore opening response format is unsupported."
		return false
	if (
		typeof(envelope.get("protocolVersion")) != TYPE_FLOAT
		or int(envelope.get("protocolVersion")) != OPENING_SESSION_PROTOCOL_VERSION
	):
		last_error = "DeathstalkerCore opening protocol version is unsupported."
		return false
	if typeof(envelope.get("ok")) != TYPE_BOOL:
		last_error = "DeathstalkerCore opening response is missing a Boolean ok field."
		return false
	if not bool(envelope.get("ok")):
		return _valid_opening_error(envelope)
	if not _has_exact_keys(envelope, [
		"format", "protocolVersion", "ok", "requestId", "sessionId", "sequence", "resultType", "view"
	]):
		last_error = "DeathstalkerCore opening success response has unexpected fields."
		return false
	if not OPENING_RESULT_TYPES.has(str(envelope.get("resultType", ""))):
		last_error = "DeathstalkerCore opening result type is unsupported."
		return false
	if typeof(envelope.get("sequence")) != TYPE_FLOAT:
		last_error = "DeathstalkerCore opening response sequence is invalid."
		return false
	var sequence := int(envelope.get("sequence", -1))
	var view_value: Variant = envelope.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore opening response is missing its view."
		return false
	var view := view_value as Dictionary
	if not _has_exact_keys(view, [
		"scenarioId", "seed", "sequence", "awaiting", "beatIndex", "beatCount", "beat",
		"party", "inventory", "recoveryChoice", "fieldContactState", "telemetry", "encounter",
		"transition", "legalActions"
	]):
		last_error = "DeathstalkerCore opening view has unexpected fields."
		return false
	if str(view.get("scenarioId", "")) != OPENING_SCENARIO_ID or int(view.get("sequence", -1)) != sequence:
		last_error = "DeathstalkerCore opening view identity or sequence is invalid."
		return false
	if not OPENING_AWAITING_TYPES.has(str(view.get("awaiting", ""))):
		last_error = "DeathstalkerCore opening awaiting state is unsupported."
		return false
	if not _valid_opening_beat(view.get("beat"), int(view.get("beatIndex", -1)), int(view.get("beatCount", 0))):
		return false
	if typeof(view.get("party")) != TYPE_ARRAY or typeof(view.get("inventory")) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore opening party or inventory is malformed."
		return false
	var beat := view.get("beat", {}) as Dictionary
	if not _valid_opening_party(
		view.get("party", []) as Array,
		beat.get("partyIds", []) as Array
	):
		return false
	if not _valid_opening_field_contact_state(view.get("fieldContactState"), beat):
		return false
	if typeof(view.get("telemetry")) != TYPE_ARRAY or not _valid_opening_telemetry(
		view.get("telemetry", []) as Array,
		int(view.get("beatIndex", -1)),
		str(beat.get("id", ""))
	):
		return false
	var legal_actions := view.get("legalActions", []) as Array
	if typeof(view.get("legalActions")) != TYPE_ARRAY:
		last_error = "DeathstalkerCore opening legal actions are malformed."
		return false
	var transition_value: Variant = view.get("transition")
	var encounter_value: Variant = view.get("encounter")
	if transition_value == null:
		if encounter_value != null or not legal_actions.is_empty():
			last_error = "Noncombat opening view exposed combat data."
			return false
		return true
	if typeof(transition_value) != TYPE_DICTIONARY or typeof(encounter_value) != TYPE_DICTIONARY:
		last_error = "Combat opening view is missing encounter or transition data."
		return false
	var loader := BridgeLoader.new()
	if not loader.validate_live_transition(encounter_value as Dictionary, transition_value as Dictionary):
		last_error = "Opening combat transition failed presentation validation: %s" % "; ".join(loader.get_errors())
		return false
	var transition := transition_value as Dictionary
	var state := transition.get("state", {}) as Dictionary
	var active_actor_id := str(state.get("activeActorId", ""))
	var combatant_ids: Array[String] = []
	for combatant_value: Variant in state.get("combatants", []) as Array:
		if typeof(combatant_value) == TYPE_DICTIONARY:
			combatant_ids.append(str((combatant_value as Dictionary).get("id", "")))
	for action_value: Variant in legal_actions:
		if typeof(action_value) != TYPE_DICTIONARY or not _valid_legal_action(action_value as Dictionary, active_actor_id, combatant_ids):
			last_error = "DeathstalkerCore opening legal action is malformed."
			return false
	var awaiting := str(view.get("awaiting", ""))
	if awaiting != "player" and not legal_actions.is_empty():
		last_error = "Opening view exposed legal actions outside a player turn."
		return false
	return true


func _valid_opening_error(envelope: Dictionary) -> bool:
	if not _has_exact_keys(envelope, [
		"format", "protocolVersion", "ok", "requestId", "sessionId", "sequence", "error"
	]):
		last_error = "DeathstalkerCore opening error response has unexpected fields."
		return false
	var error_value: Variant = envelope.get("error")
	if typeof(error_value) != TYPE_DICTIONARY or not _has_exact_keys(error_value as Dictionary, ["code", "message"]):
		last_error = "DeathstalkerCore opening error response is malformed."
		return false
	last_error = "%s: %s" % [
		str((error_value as Dictionary).get("code", "unknown_error")),
		str((error_value as Dictionary).get("message", "No error message supplied.")),
	]
	return true


func _valid_opening_beat(value: Variant, beat_index: int, beat_count: int) -> bool:
	if typeof(value) != TYPE_DICTIONARY or beat_index < 0 or beat_count != 10 or beat_index >= beat_count:
		last_error = "DeathstalkerCore opening beat position is invalid."
		return false
	var beat := value as Dictionary
	if not _has_exact_keys(beat, [
		"id", "journeyMovement", "kind", "objectiveKey", "environmentState", "partyIds",
		"exploration"
	]):
		last_error = "DeathstalkerCore opening beat is malformed."
		return false
	if (
		str(beat.get("journeyMovement", "")) != "separation"
		or typeof(beat.get("partyIds")) != TYPE_ARRAY
		or not _valid_opening_exploration(beat.get("exploration"), beat_index)
	):
		last_error = "DeathstalkerCore opening beat movement or party is invalid."
		return false
	return true


func _valid_opening_point(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		return false
	var point := value as Dictionary
	return (
		_has_exact_keys(point, ["x", "y"])
		and typeof(point.get("x")) == TYPE_FLOAT
		and typeof(point.get("y")) == TYPE_FLOAT
		and is_finite(float(point.get("x", 0.0)))
		and is_finite(float(point.get("y", 0.0)))
	)


func _valid_opening_route(value: Variant) -> bool:
	if typeof(value) != TYPE_ARRAY or (value as Array).size() < 2:
		return false
	for point_value: Variant in value as Array:
		if not _valid_opening_point(point_value):
			return false
	return true


func _valid_opening_exploration(value: Variant, beat_index: int) -> bool:
	if value == null:
		return true
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore opening exploration map is malformed."
		return false
	var map := value as Dictionary
	if not _has_exact_keys(map, [
		"id", "bounds", "defaultEntryPosition", "walkableAreas", "mainRoute",
		"secondaryRoutes", "landmarks", "objectiveLandmarkId", "interactionRadius", "fieldContacts"
	]):
		last_error = "DeathstalkerCore opening exploration map has unexpected fields."
		return false
	if (
		not _nonempty_string(map.get("id"))
		or not _nonempty_string(map.get("objectiveLandmarkId"))
		or typeof(map.get("interactionRadius")) != TYPE_FLOAT
		or float(map.get("interactionRadius", 0.0)) <= 0.0
		or not _valid_opening_point(map.get("defaultEntryPosition"))
		or not _valid_opening_route(map.get("mainRoute"))
		or typeof(map.get("secondaryRoutes")) != TYPE_ARRAY
		or typeof(map.get("walkableAreas")) != TYPE_ARRAY
		or typeof(map.get("landmarks")) != TYPE_ARRAY
		or typeof(map.get("fieldContacts")) != TYPE_ARRAY
	):
		last_error = "DeathstalkerCore opening exploration map fields are malformed."
		return false
	var bounds_value: Variant = map.get("bounds")
	if typeof(bounds_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore opening exploration bounds are malformed."
		return false
	var bounds := bounds_value as Dictionary
	if not _has_exact_keys(bounds, ["minX", "minY", "maxX", "maxY"]):
		last_error = "DeathstalkerCore opening exploration bounds have unexpected fields."
		return false
	for key in ["minX", "minY", "maxX", "maxY"]:
		if typeof(bounds.get(key)) != TYPE_FLOAT or not is_finite(float(bounds.get(key, 0.0))):
			last_error = "DeathstalkerCore opening exploration bounds are invalid."
			return false
	if (
		float(bounds.get("minX", 0.0)) >= float(bounds.get("maxX", 0.0))
		or float(bounds.get("minY", 0.0)) >= float(bounds.get("maxY", 0.0))
	):
		last_error = "DeathstalkerCore opening exploration bounds are empty."
		return false
	var walkable_areas := map.get("walkableAreas", []) as Array
	if walkable_areas.is_empty():
		last_error = "DeathstalkerCore opening exploration map has no walkable ground."
		return false
	for area_value: Variant in walkable_areas:
		if typeof(area_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore opening walkable area is malformed."
			return false
		var area := area_value as Dictionary
		if not _has_exact_keys(area, ["x", "y", "width", "height"]):
			last_error = "DeathstalkerCore opening walkable area has unexpected fields."
			return false
		for key in ["x", "y", "width", "height"]:
			if typeof(area.get(key)) != TYPE_FLOAT or not is_finite(float(area.get(key, 0.0))):
				last_error = "DeathstalkerCore opening walkable area is invalid."
				return false
		if float(area.get("width", 0.0)) <= 0.0 or float(area.get("height", 0.0)) <= 0.0:
			last_error = "DeathstalkerCore opening walkable area size is invalid."
			return false
	for route_value: Variant in map.get("secondaryRoutes", []) as Array:
		if not _valid_opening_route(route_value):
			last_error = "DeathstalkerCore opening secondary route is malformed."
			return false
	var objective_id := str(map.get("objectiveLandmarkId", ""))
	var objective_found := false
	var landmark_ids: Array[String] = []
	for landmark_value: Variant in map.get("landmarks", []) as Array:
		if typeof(landmark_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore opening landmark is malformed."
			return false
		var landmark := landmark_value as Dictionary
		if (
			not _has_exact_keys(landmark, ["id", "kind", "guidanceRole", "position"])
			or not _nonempty_string(landmark.get("id"))
			or not _nonempty_string(landmark.get("kind"))
			or not ["global", "local", "objective", "threat", "transition"].has(
				str(landmark.get("guidanceRole", ""))
			)
			or not _valid_opening_point(landmark.get("position"))
		):
			last_error = "DeathstalkerCore opening landmark fields are malformed."
			return false
		var landmark_id := str(landmark.get("id", ""))
		if landmark_ids.has(landmark_id):
			last_error = "DeathstalkerCore opening landmark identifiers are duplicated."
			return false
		landmark_ids.append(landmark_id)
		objective_found = objective_found or landmark_id == objective_id
	if not objective_found:
		last_error = "DeathstalkerCore opening objective landmark is missing."
		return false
	var contact_ids: Array[String] = []
	for contact_value: Variant in map.get("fieldContacts", []) as Array:
		if not _valid_opening_field_contact(contact_value):
			return false
		var contact_id := str((contact_value as Dictionary).get("id", ""))
		if contact_ids.has(contact_id):
			last_error = "DeathstalkerCore opening field contact identifiers are duplicated."
			return false
		contact_ids.append(contact_id)
	return true


func _valid_opening_field_contact(value: Variant) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore opening field contact is malformed."
		return false
	var contact := value as Dictionary
	if not _has_exact_keys(contact, [
		"id", "encounterId", "position", "facing", "awarenessRange",
		"awarenessHalfAngleDegrees", "fieldStrikeRange", "collisionRadius", "required",
		"persistent"
	]):
		last_error = "DeathstalkerCore opening field contact has unexpected fields."
		return false
	if (
		not _nonempty_string(contact.get("id"))
		or not _nonempty_string(contact.get("encounterId"))
		or not _valid_opening_point(contact.get("position"))
		or not _valid_opening_point(contact.get("facing"))
		or typeof(contact.get("awarenessRange")) != TYPE_FLOAT
		or typeof(contact.get("awarenessHalfAngleDegrees")) != TYPE_FLOAT
		or typeof(contact.get("fieldStrikeRange")) != TYPE_FLOAT
		or typeof(contact.get("collisionRadius")) != TYPE_FLOAT
		or typeof(contact.get("required")) != TYPE_BOOL
		or typeof(contact.get("persistent")) != TYPE_BOOL
	):
		last_error = "DeathstalkerCore opening field contact fields are malformed."
		return false
	var facing := contact.get("facing", {}) as Dictionary
	if is_zero_approx(Vector2(
		float(facing.get("x", 0.0)),
		float(facing.get("y", 0.0))
	).length()):
		last_error = "DeathstalkerCore opening field contact facing is zero."
		return false
	var awareness_range := float(contact.get("awarenessRange", 0.0))
	var half_angle := float(contact.get("awarenessHalfAngleDegrees", 0.0))
	var strike_range := float(contact.get("fieldStrikeRange", 0.0))
	var collision_radius := float(contact.get("collisionRadius", 0.0))
	if (
		awareness_range <= 0.0
		or half_angle <= 0.0
		or half_angle > 180.0
		or strike_range < collision_radius
		or awareness_range < collision_radius
		or collision_radius <= 0.0
	):
		last_error = "DeathstalkerCore opening field contact ranges are invalid."
		return false
	return true


func _valid_opening_field_contact_state(value: Variant, beat: Dictionary) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore opening field contact state is malformed."
		return false
	var state := value as Dictionary
	if not _has_exact_keys(state, ["activeContactId", "clearedContactIds", "advantage"]):
		last_error = "DeathstalkerCore opening field contact state has unexpected fields."
		return false
	var active_value: Variant = state.get("activeContactId")
	var advantage_value: Variant = state.get("advantage")
	if active_value != null and not _nonempty_string(active_value):
		last_error = "DeathstalkerCore opening active field contact is invalid."
		return false
	if advantage_value != null and not ["player", "enemy", "normal"].has(str(advantage_value)):
		last_error = "DeathstalkerCore opening field contact advantage is invalid."
		return false
	if (active_value == null) != (advantage_value == null):
		last_error = "DeathstalkerCore opening field contact identity and advantage disagree."
		return false
	var cleared_value: Variant = state.get("clearedContactIds")
	if typeof(cleared_value) != TYPE_ARRAY:
		last_error = "DeathstalkerCore opening cleared field contacts are malformed."
		return false
	var cleared_ids: Array[String] = []
	for id_value: Variant in cleared_value as Array:
		if not _nonempty_string(id_value) or cleared_ids.has(str(id_value)):
			last_error = "DeathstalkerCore opening cleared field contact identifiers are invalid."
			return false
		cleared_ids.append(str(id_value))
	var exploration_value: Variant = beat.get("exploration")
	if active_value != null:
		if typeof(exploration_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore opening active field contact has no exploration map."
			return false
		var active_found := false
		for contact_value: Variant in (exploration_value as Dictionary).get("fieldContacts", []) as Array:
			if str((contact_value as Dictionary).get("id", "")) == str(active_value):
				active_found = true
				break
		if not active_found:
			last_error = "DeathstalkerCore opening active field contact is not declared by the map."
			return false
	return true


func _valid_opening_party(party: Array, expected_party_ids: Array) -> bool:
	if party.size() != expected_party_ids.size():
		last_error = "DeathstalkerCore opening party does not match the current beat."
		return false
	for member_index in party.size():
		var member_value: Variant = party[member_index]
		if typeof(member_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore opening party member is malformed."
			return false
		var member := member_value as Dictionary
		if not _has_exact_keys(member, ["id", "name", "role", "hp", "maxHp"]):
			last_error = "DeathstalkerCore opening party member has unexpected fields."
			return false
		if (
			typeof(member.get("id")) != TYPE_STRING
			or typeof(member.get("name")) != TYPE_STRING
			or typeof(member.get("role")) != TYPE_STRING
			or typeof(member.get("hp")) != TYPE_FLOAT
			or typeof(member.get("maxHp")) != TYPE_FLOAT
		):
			last_error = "DeathstalkerCore opening party member fields are malformed."
			return false
		if (
			str(member.get("id", "")) != str(expected_party_ids[member_index])
			or str(member.get("name", "")).is_empty()
			or str(member.get("role", "")).is_empty()
			or float(member.get("hp", -1.0)) < 0.0
			or float(member.get("maxHp", 0.0)) <= 0.0
			or float(member.get("hp", 0.0)) > float(member.get("maxHp", 0.0))
		):
			last_error = "DeathstalkerCore opening party member is inconsistent."
			return false
	return true


func _valid_opening_telemetry(telemetry: Array, beat_index: int, current_beat_id: String) -> bool:
	if telemetry.size() != beat_index + 1 or telemetry.is_empty():
		last_error = "DeathstalkerCore opening boundary telemetry count is invalid."
		return false
	for boundary_index in telemetry.size():
		var boundary_value: Variant = telemetry[boundary_index]
		if typeof(boundary_value) != TYPE_DICTIONARY:
			last_error = "DeathstalkerCore opening boundary telemetry entry is malformed."
			return false
		var boundary := boundary_value as Dictionary
		if not _has_exact_keys(boundary, [
			"beatId", "beatIndex", "jobKey", "party", "inventory", "recoveryChoice", "encounter"
		]):
			last_error = "DeathstalkerCore opening boundary telemetry has unexpected fields."
			return false
		if (
			typeof(boundary.get("beatId")) != TYPE_STRING
			or typeof(boundary.get("beatIndex")) != TYPE_FLOAT
			or int(boundary.get("beatIndex", -1)) != boundary_index
			or typeof(boundary.get("jobKey")) != TYPE_STRING
			or str(boundary.get("jobKey", "")).is_empty()
			or typeof(boundary.get("party")) != TYPE_ARRAY
			or (boundary.get("party", []) as Array).is_empty()
			or typeof(boundary.get("inventory")) != TYPE_DICTIONARY
		):
			last_error = "DeathstalkerCore opening boundary telemetry fields are malformed."
			return false
		for member_value: Variant in boundary.get("party", []) as Array:
			if typeof(member_value) != TYPE_DICTIONARY:
				last_error = "DeathstalkerCore opening telemetry party member is malformed."
				return false
			var member := member_value as Dictionary
			if not _has_exact_keys(member, ["id", "hp", "maxHp", "hpPercentage"]):
				last_error = "DeathstalkerCore opening telemetry party member has unexpected fields."
				return false
			if (
				typeof(member.get("id")) != TYPE_STRING
				or typeof(member.get("hp")) != TYPE_FLOAT
				or typeof(member.get("maxHp")) != TYPE_FLOAT
				or typeof(member.get("hpPercentage")) != TYPE_FLOAT
				or float(member.get("hp", -1.0)) < 0.0
				or float(member.get("maxHp", 0.0)) <= 0.0
				or float(member.get("hp", 0.0)) > float(member.get("maxHp", 0.0))
				or float(member.get("hpPercentage", -1.0)) < 0.0
				or float(member.get("hpPercentage", 2.0)) > 1.0
			):
				last_error = "DeathstalkerCore opening telemetry party member is inconsistent."
				return false
		var inventory := boundary.get("inventory", {}) as Dictionary
		if not _has_exact_keys(inventory, ["medkits", "revives"]):
			last_error = "DeathstalkerCore opening telemetry inventory is malformed."
			return false
		if (
			typeof(inventory.get("medkits")) != TYPE_FLOAT
			or typeof(inventory.get("revives")) != TYPE_FLOAT
			or float(inventory.get("medkits", -1.0)) < 0.0
			or float(inventory.get("revives", -1.0)) < 0.0
		):
			last_error = "DeathstalkerCore opening telemetry inventory is inconsistent."
			return false
		var recovery_choice: Variant = boundary.get("recoveryChoice")
		if recovery_choice != null and not ["use_medkit", "continue"].has(str(recovery_choice)):
			last_error = "DeathstalkerCore opening telemetry recovery choice is invalid."
			return false
		var encounter_value: Variant = boundary.get("encounter")
		if encounter_value != null:
			if typeof(encounter_value) != TYPE_DICTIONARY:
				last_error = "DeathstalkerCore opening encounter telemetry is malformed."
				return false
			var encounter := encounter_value as Dictionary
			if not _has_exact_keys(encounter, ["id", "status", "turnNumber", "actionCount"]):
				last_error = "DeathstalkerCore opening encounter telemetry has unexpected fields."
				return false
			if (
				typeof(encounter.get("id")) != TYPE_STRING
				or not ["in_progress", "victory", "defeat"].has(str(encounter.get("status", "")))
				or typeof(encounter.get("turnNumber")) != TYPE_FLOAT
				or typeof(encounter.get("actionCount")) != TYPE_FLOAT
				or float(encounter.get("turnNumber", -1.0)) < 0.0
				or float(encounter.get("actionCount", -1.0)) < 0.0
			):
				last_error = "DeathstalkerCore opening encounter telemetry is inconsistent."
				return false
	var final_boundary := telemetry[telemetry.size() - 1] as Dictionary
	if str(final_boundary.get("beatId", "")) != current_beat_id:
		last_error = "DeathstalkerCore opening telemetry does not end at the current beat."
		return false
	return true


func _valid_envelope(envelope: Dictionary) -> bool:
	last_error = ""
	if typeof(envelope.get("format")) != TYPE_STRING or str(envelope.get("format")) != LIVE_SESSION_FORMAT:
		last_error = "DeathstalkerCore response format is unsupported."
		return false
	if (
		typeof(envelope.get("protocolVersion")) != TYPE_FLOAT
		or int(envelope.get("protocolVersion")) != LIVE_SESSION_PROTOCOL_VERSION
	):
		last_error = "DeathstalkerCore response protocol version is unsupported."
		return false
	if typeof(envelope.get("ok")) != TYPE_BOOL:
		last_error = "DeathstalkerCore response is missing a Boolean ok field."
		return false
	if not bool(envelope.get("ok")):
		if not _has_exact_keys(
			envelope,
			["format", "protocolVersion", "ok", "requestId", "sessionId", "sequence", "error"]
		):
			last_error = "DeathstalkerCore error response has unexpected fields."
			return false
		var error_value: Variant = envelope.get("error")
		if (
			typeof(error_value) != TYPE_DICTIONARY
			or not _has_exact_keys(error_value as Dictionary, ["code", "message"])
		):
			last_error = "DeathstalkerCore error response is malformed."
			return false
		var error_dictionary := error_value as Dictionary
		last_error = "%s: %s" % [
			str(error_dictionary.get("code", "unknown_error")),
			str(error_dictionary.get("message", "No error message supplied.")),
		]
		return true
	if not _has_exact_keys(
		envelope,
		[
			"format",
			"protocolVersion",
			"ok",
			"requestId",
			"sessionId",
			"sequence",
			"resultType",
			"view",
		]
	):
		last_error = "DeathstalkerCore success response has unexpected fields."
		return false
	if (
		typeof(envelope.get("requestId")) != TYPE_STRING
		or str(envelope.get("requestId")).is_empty()
		or typeof(envelope.get("sessionId")) != TYPE_STRING
		or str(envelope.get("sessionId")).is_empty()
	):
		last_error = "DeathstalkerCore success response IDs are invalid."
		return false
	if (
		typeof(envelope.get("resultType")) != TYPE_STRING
		or not RESULT_TYPES.has(str(envelope.get("resultType")))
	):
		last_error = "DeathstalkerCore success result type is unsupported."
		return false
	if typeof(envelope.get("sequence")) != TYPE_FLOAT:
		last_error = "DeathstalkerCore success response is missing a numeric sequence."
		return false
	var sequence := float(envelope.get("sequence"))
	if not is_finite(sequence) or sequence < 0.0 or floorf(sequence) != sequence:
		last_error = "DeathstalkerCore success response sequence is invalid."
		return false
	var view_value: Variant = envelope.get("view")
	if typeof(view_value) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore success response is missing its view."
		return false
	var view := view_value as Dictionary
	if not _has_exact_keys(
		view,
		["scenarioId", "seed", "sequence", "awaiting", "encounter", "transition", "legalActions"]
	):
		last_error = "DeathstalkerCore success view has unexpected fields."
		return false
	if str(view.get("scenarioId", "")) != "range-band-prototype":
		last_error = "DeathstalkerCore success view scenario is unsupported."
		return false
	if typeof(view.get("seed")) != TYPE_FLOAT or not is_finite(float(view.get("seed"))):
		last_error = "DeathstalkerCore success view seed is invalid."
		return false
	if typeof(view.get("sequence")) != TYPE_FLOAT or float(view.get("sequence")) != sequence:
		last_error = "DeathstalkerCore view sequence does not match its envelope."
		return false
	if (
		typeof(view.get("awaiting")) != TYPE_STRING
		or not AWAITING_TYPES.has(str(view.get("awaiting")))
	):
		last_error = "DeathstalkerCore success view awaiting state is unsupported."
		return false
	if typeof(view.get("encounter")) != TYPE_DICTIONARY or typeof(view.get("transition")) != TYPE_DICTIONARY:
		last_error = "DeathstalkerCore success response is missing its transition."
		return false
	if typeof(view.get("legalActions")) != TYPE_ARRAY:
		last_error = "DeathstalkerCore success response is missing legal actions."
		return false
	var loader := BridgeLoader.new()
	if not loader.validate_live_transition(
		view.get("encounter", {}) as Dictionary,
		view.get("transition", {}) as Dictionary
	):
		last_error = "DeathstalkerCore transition failed presentation validation: %s" % "; ".join(loader.get_errors())
		return false
	var legal_actions := view.get("legalActions", []) as Array
	if str(view.get("awaiting")) != "player" and not legal_actions.is_empty():
		last_error = "DeathstalkerCore exposed player legal actions outside a player turn."
		return false
	if str(view.get("awaiting")) == "player" and legal_actions.is_empty():
		last_error = "DeathstalkerCore player turn exposed no legal actions."
		return false
	var transition := view.get("transition", {}) as Dictionary
	var state := transition.get("state", {}) as Dictionary
	var active_actor_id := str(state.get("activeActorId", ""))
	var combatant_ids: Array[String] = []
	for combatant_value: Variant in state.get("combatants", []) as Array:
		if typeof(combatant_value) == TYPE_DICTIONARY:
			combatant_ids.append(str((combatant_value as Dictionary).get("id", "")))
	for action_index in legal_actions.size():
		var action_value: Variant = legal_actions[action_index]
		if (
			typeof(action_value) != TYPE_DICTIONARY
			or not _valid_legal_action(
				action_value as Dictionary,
				active_actor_id,
				combatant_ids
			)
		):
			last_error = "DeathstalkerCore legal action %d is malformed." % action_index
			return false
	return true


func _valid_legal_action(
	action: Dictionary,
	active_actor_id: String,
	combatant_ids: Array[String]
) -> bool:
	if typeof(action.get("type")) != TYPE_STRING or typeof(action.get("actorId")) != TYPE_STRING:
		return false
	if str(action.get("actorId")) != active_actor_id:
		return false
	if action.has("targetId") and not combatant_ids.has(str(action.get("targetId"))):
		return false
	match str(action.get("type")):
		"Attack":
			return (
				_has_exact_keys(action, ["type", "actorId", "targetId", "abilityId"])
				and _nonempty_string(action.get("targetId"))
				and _nonempty_string(action.get("abilityId"))
			)
		"Disruptor", "UseMedkit", "UseRevive":
			return (
				_has_exact_keys(action, ["type", "actorId", "targetId"])
				and _nonempty_string(action.get("targetId"))
			)
		"Advance":
			return (
				_has_exact_keys(action, ["type", "actorId"], ["targetId"])
				and (not action.has("targetId") or _nonempty_string(action.get("targetId")))
			)
		"RaiseShield", "PassTurn":
			return _has_exact_keys(action, ["type", "actorId"])
		"ToggleBoost":
			return _has_exact_keys(action, ["type", "actorId", "enable"]) and typeof(action.get("enable")) == TYPE_BOOL
		"EsperAbility":
			return (
				_has_exact_keys(action, ["type", "actorId", "abilityId"], ["targetId"])
				and _nonempty_string(action.get("abilityId"))
				and (not action.has("targetId") or _nonempty_string(action.get("targetId")))
			)
		_:
			return false


func _has_exact_keys(value: Dictionary, required: Array[String], optional: Array[String] = []) -> bool:
	for key in required:
		if not value.has(key):
			return false
	for key_value: Variant in value.keys():
		var key := str(key_value)
		if not required.has(key) and not optional.has(key):
			return false
	return true


func _nonempty_string(value: Variant) -> bool:
	return typeof(value) == TYPE_STRING and not str(value).strip_edges().is_empty()
