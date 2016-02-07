export function sizeBreakpoints(size) {
  switch (size) {
    case 'xs': return 544;
    case 'sm': return 768;
    case 'md': return 992;
    case 'lg': return 1200;
    default:
      return 1440;
  }
}

export function currentSize() {
  if (innerWidth < 544) { return 'xs'; }
  if (innerWidth < 768) { return 'sm'; }
  if (innerWidth < 992) { return 'md'; }
  if (innerWidth < 1200) { return 'lg'; }
  return 'xl';
}

export function testSize(requestedSize, direction) {
  if (direction) {
    if (direction === 'up') {
      return requestedSize === 'xs' || innerWidth >= sizeBreakpoints(requestedSize);
    } else if (direction === 'down') {
      return requestedSize === 'xl' || innerWidth <= sizeBreakpoints(requestedSize);
    }
  } else {
    return requestedSize === currentSize();
  }
  return false;
}
