saleItems.getCSVObj = (sId, req) => {
  const sI = saleItems.findOne(sId);
  return {
    category: sI.category ? sI.category.replace(/,/g , " ") : '',
    name: sI.name ? sI.name.replace(/,/g , " ") : '',
    price: sI.price || 0,
    description: sI.description ? sI.description.replace(/,/g , " ") : ''
  };
};
