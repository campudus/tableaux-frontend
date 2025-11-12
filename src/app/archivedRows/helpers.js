export const isRowArchived = row => Boolean(row.archived);

export const isLinkArchived = link => Boolean(link.archived);

export const ShowArchived = {
  hide: "hide",
  show: "show",
  exclusive: "exclusive",
  linked: "linked"
};
