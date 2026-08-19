function toNumber(value) { return Number(value); }

function normalizeRegion(form) {
  const region = {
    x: toNumber(form.x), y: toNumber(form.y),
    width: toNumber(form.width), height: toNumber(form.height)
  };
  if (Object.values(region).some((value) => Number.isNaN(value) || value < 0 || value > 1) ||
      region.width === 0 || region.height === 0 || region.x + region.width > 1 || region.y + region.height > 1) {
    throw new Error("请填写有效区域：均为 0～1，且区域不能超出画面");
  }
  return region;
}

module.exports = { normalizeRegion };
