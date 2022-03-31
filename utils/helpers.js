const saleStatuses = {
  0: "Pending",
  1: "Pre Sale",
  2: "Public Sale",
  3: "Sold Out",
};

const pickStatusTitle = (index) => {
  return saleStatuses[index];
};

export { saleStatuses, pickStatusTitle };
