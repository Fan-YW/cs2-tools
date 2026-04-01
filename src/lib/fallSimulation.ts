/** Fall tick simulation aligned with reference Java loop + 3500 velocity cap on displacement. */

export const FALL_VELOCITY_CAP = 3500;
export const FALL_FLOOR_BREAK = 2;

export interface FallSimRow {
  currTick: number;
  time: number;
  velocityDisplay: number;
  uncappedVelocity: number;
  heightStart: number;
  heightFloor: number;
}

export interface FallSimResult {
  rows: FallSimRow[];
  /** `prevVelocity` at loop exit (Java semantics; used for landing damage). */
  landingPrevVelocity: number;
  landingDamage: number;
}

/**
 * @param initTick fractional server tick at t=0 (GO: 0; CS2: offsetSeconds * tickRate)
 * @param initVelocity jump/fall initial vertical velocity (Java sign)
 */
export function runFallSimulation(params: {
  tickRate: number;
  initTick: number;
  initVelocity: number;
  startHeightFloor: number;
  svGravity: number;
}): FallSimResult {
  const { tickRate, initTick, initVelocity, startHeightFloor, svGravity: g } = params;
  const rows: FallSimRow[] = [];

  if (g <= 0 || startHeightFloor <= 0 || tickRate <= 0) {
    return { rows, landingPrevVelocity: 0, landingDamage: 0 };
  }

  const INIT_TIME = initTick / tickRate;
  let prevTick = initTick;
  let currTick = initTick;
  let prevVelocity = 0;
  let heightStart = 0;
  let heightFloor = startHeightFloor;
  let terminalDispOnly = false;

  while (true) {
    const time = currTick / tickRate;
    const currVelocity = (time - INIT_TIME) * g + initVelocity;

    if (currTick > initTick) {
      const dt = (currTick - prevTick) / tickRate;
      let disp = 0;
      if (terminalDispOnly) {
        disp = FALL_VELOCITY_CAP * dt;
      } else {
        const v0 = prevVelocity;
        const v1 = currVelocity;
        if (v0 >= FALL_VELOCITY_CAP) {
          disp = FALL_VELOCITY_CAP * dt;
          terminalDispOnly = true;
        } else if (v1 > FALL_VELOCITY_CAP) {
          const t1 = (FALL_VELOCITY_CAP - v0) / g;
          if (t1 > 0 && t1 < dt) {
            disp = v0 * t1 + 0.5 * g * t1 * t1 + FALL_VELOCITY_CAP * (dt - t1);
            terminalDispOnly = true;
          } else {
            disp = v0 * dt + 0.5 * g * dt * dt;
          }
        } else {
          disp = v0 * dt + 0.5 * g * dt * dt;
        }
      }
      heightStart -= disp;
      heightFloor -= disp;
    }

    if (heightFloor < FALL_FLOOR_BREAK) {
      break;
    }

    const velocityDisplay = Math.min(currVelocity, FALL_VELOCITY_CAP);
    rows.push({
      currTick,
      time: currTick / tickRate,
      velocityDisplay,
      uncappedVelocity: currVelocity,
      heightStart,
      heightFloor
    });

    prevTick = currTick;
    currTick = Math.floor(currTick) + 1;
    prevVelocity = currVelocity;
  }

  const landingDamage = Math.max(0, ((prevVelocity - 580) / 420) * 100);
  return { rows, landingPrevVelocity: prevVelocity, landingDamage };
}
