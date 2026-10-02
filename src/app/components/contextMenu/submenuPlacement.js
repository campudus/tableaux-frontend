// opensSubmenuToLeft : { x, menuWidth, submenuWidth, viewportWidth } -> Boolean
export const opensSubmenuToLeft = ({
  x,
  menuWidth,
  submenuWidth,
  viewportWidth
}) => x + menuWidth + submenuWidth > viewportWidth;
