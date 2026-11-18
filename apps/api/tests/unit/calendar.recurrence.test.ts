import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseRRule, expandRecurringEvent } from "../../src/modules/calendar/recurrence.util.js";

describe("Calendar Recurrence Engine Unit Tests", () => {
  it("parses daily recurrence rule correctly", () => {
    const rule = parseRRule("RRULE:FREQ=DAILY;INTERVAL=2;COUNT=5");
    assert.ok(rule);
    assert.equal(rule.freq, "DAILY");
    assert.equal(rule.interval, 2);
    assert.equal(rule.count, 5);
  });

  it("parses weekly rule with BYDAY and UNTIL", () => {
    const rule = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261231T235959Z");
    assert.ok(rule);
    assert.equal(rule.freq, "WEEKLY");
    assert.deepEqual(rule.byDay, ["MO", "WE", "FR"]);
    assert.ok(rule.until);
    assert.equal(rule.until.getUTCFullYear(), 2026);
    assert.equal(rule.until.getUTCMonth(), 11); // December (0-indexed)
  });

  it("returns null on invalid rule string", () => {
    assert.equal(parseRRule(""), null);
    assert.equal(parseRRule("FREQ=INVALID"), null);
  });

  it("expands daily recurring event within target date range", () => {
    const event = {
      id: "1",
      startTime: new Date("2026-11-01T09:00:00Z"),
      endTime: new Date("2026-11-01T10:00:00Z"),
      recurrenceRule: "FREQ=DAILY;INTERVAL=1",
    };

    const rangeStart = new Date("2026-11-05T00:00:00Z");
    const rangeEnd = new Date("2026-11-08T23:59:59Z");

    const instances = expandRecurringEvent(event, rangeStart, rangeEnd);
    assert.equal(instances.length, 4); // 5th, 6th, 7th, 8th
    assert.equal(instances[0].startTime.toISOString(), "2026-11-05T09:00:00.000Z");
    assert.equal(instances[3].startTime.toISOString(), "2026-11-08T09:00:00.000Z");
    assert.equal(instances[0].isRecurringInstance, true);
    assert.equal(instances[0].masterEventId, "1");
  });

  it("respects recurrenceExceptions and skips excluded instances", () => {
    const event = {
      id: "2",
      startTime: new Date("2026-11-01T09:00:00Z"),
      endTime: new Date("2026-11-01T10:00:00Z"),
      recurrenceRule: "FREQ=DAILY;INTERVAL=1",
      recurrenceExceptions: "2026-11-06T09:00:00Z", // Skip 6th Nov
    };

    const rangeStart = new Date("2026-11-05T00:00:00Z");
    const rangeEnd = new Date("2026-11-07T23:59:59Z");

    const instances = expandRecurringEvent(event, rangeStart, rangeEnd);
    assert.equal(instances.length, 2); // 5th and 7th only (6th skipped)
    assert.equal(instances[0].startTime.toISOString(), "2026-11-05T09:00:00.000Z");
    assert.equal(instances[1].startTime.toISOString(), "2026-11-07T09:00:00.000Z");
  });

  it("respects COUNT constraint and stops when count reached", () => {
    const event = {
      id: "3",
      startTime: new Date("2026-11-01T09:00:00Z"),
      endTime: new Date("2026-11-01T10:00:00Z"),
      recurrenceRule: "FREQ=DAILY;COUNT=3",
    };

    const rangeStart = new Date("2026-11-01T00:00:00Z");
    const rangeEnd = new Date("2026-11-30T23:59:59Z");

    const instances = expandRecurringEvent(event, rangeStart, rangeEnd);
    assert.equal(instances.length, 3); // 1st, 2nd, 3rd only
  });

  it("handles non-recurring events by returning original event in array", () => {
    const event = {
      id: "4",
      startTime: new Date("2026-11-18T10:00:00Z"),
      endTime: new Date("2026-11-18T11:00:00Z"),
      recurrenceRule: null,
    };

    const instances = expandRecurringEvent(event, new Date("2026-11-01Z"), new Date("2026-11-30Z"));
    assert.equal(instances.length, 1);
    assert.equal(instances[0].id, "4");
  });
});
