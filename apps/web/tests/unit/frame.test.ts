import { describe, expect, it } from "vitest";
import { MAX_ZOOM, boxToParam, centeredBox, clampBox, panBy, parseBoxParam, zoomOf, zoomTo } from "@/lib/frame";

const size = { width: 1200, height: 800 };

describe("cadrage manuel", () => {
  it("part du plus grand carré central", () => {
    expect(centeredBox(size)).toEqual({ x: 200, y: 0, side: 800 });
    expect(zoomOf(centeredBox(size), size)).toBe(1);
  });

  it("reste dans la photo et dans les limites de zoom", () => {
    expect(clampBox({ x: -50, y: 900, side: 2000 }, size)).toEqual({ x: 0, y: 0, side: 800 });
    expect(clampBox({ x: 0, y: 0, side: 10 }, size).side).toBeCloseTo(800 / MAX_ZOOM);
  });

  it("zoome autour du centre, ou du point pincé", () => {
    const z = zoomTo(centeredBox(size), 2, size);
    expect(z).toEqual({ x: 400, y: 200, side: 400 });
    const corner = zoomTo(centeredBox(size), 2, size, 0, 0);
    expect(corner).toEqual({ x: 200, y: 0, side: 400 });
    expect(zoomTo(z, 99, size).side).toBeCloseTo(800 / MAX_ZOOM);
  });

  it("glisse la photo à l'inverse du doigt, à l'échelle de l'écran", () => {
    const z = { x: 400, y: 200, side: 400 };
    expect(panBy(z, 100, -50, 0.5, size)).toEqual({ x: 200, y: 300, side: 400 });
    expect(panBy(z, 10_000, 0, 1, size).x).toBe(0);
  });

  it("transmet et relit le cadrage", () => {
    expect(boxToParam({ x: 10.4, y: 20.6, side: 300.2 })).toBe("10,21,300");
    expect(parseBoxParam("10,21,300")).toEqual([10, 21, 300]);
    for (const bad of ["", "a,b,c", "-1,0,300", "1,2", "0,0,10", undefined, 5]) expect(parseBoxParam(bad)).toBeNull();
  });
});
