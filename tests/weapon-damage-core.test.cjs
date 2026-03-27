const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../js/weapon-damage-core.cjs");

function baseWeapon() {
  return {
    damage: 10,
    headMul: 4,
    rangeMod: 1,
    weaponArmor: 1.5,
    bullets: 1,
    range: 1000,
  };
}

test("distance == range 时不归零", () => {
  const row = core.calcWeaponRow(baseWeapon(), 1000);
  assert.ok(row);
  assert.equal(row.overRange, false);
  assert.equal(row.noChest, 10);
});

test("distance > range 时全部归零", () => {
  const row = core.calcWeaponRow(baseWeapon(), 1001);
  assert.ok(row);
  assert.equal(row.overRange, true);
  assert.equal(row.noHead, 0);
  assert.equal(row.noChest, 0);
  assert.equal(row.noAbd, 0);
  assert.equal(row.noLeg, 0);
  assert.equal(row.armHead, 0);
  assert.equal(row.armChest, 0);
  assert.equal(row.armAbd, 0);
  assert.equal(row.redHead, 0);
});

test("bullets > 1 时伤害按 bullets 乘算", () => {
  const w = baseWeapon();
  w.bullets = 8;
  const row = core.calcWeaponRow(w, 0);
  assert.ok(row);
  assert.equal(row.noChest, 80);
  assert.equal(row.noHead, 320);
});

test("高亮阈值以两位小数后的展示值判断", () => {
  assert.equal(core.shouldHighlight(99.9999), false);
  assert.equal(core.shouldHighlight(100), true);
  assert.equal(core.shouldHighlight(100.0001), true);
});
