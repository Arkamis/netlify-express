const fetch = require("node-fetch");

const HASURA_OPERATION = `
query getProductInventoryId($cantidad: Int!, $id_producto: uuid!, $codigo_postal: String) {
  inventario(limit: 1, order_by: {disponibles: desc}, where: {disponibles: {_gte: $cantidad}, _and: {almacenamiento: {almacen: {codigo_postal_almacens: {codigo_postal: {_eq: $codigo_postal}}}}}, producto: {id_producto: {_eq: $id_producto}}}) {
    id_inventario
  }
}
`;

// execute the parent operation in Hasura
const execute = async (variables) => {
  const fetchResponse = await fetch("https://rayo-dev.hasura.app/v1/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: HASURA_OPERATION,
      variables,
    }),
  });
  const data = await fetchResponse.json();
  console.log("DEBUG: ", data);
  return data;
};

// Request Handler
module.exports = performStockUpdate = async (req, res) => {
  // get request input
  const {
    codigo_postal_destino,
    id_cliente,
    detalle_orden
  } = req.body.input;

  try {
    // validateAvailableStock and retrive Inventory ID of that stock.
    const detalle_updated = await retriveInventoryId(detalle_orden, codigo_postal_destino, id_cliente);
    //if data validated, just execute the update
    // execute the Hasura operation
    await updateInventoryByPk(detalle_updated);
    
    // success
    return res.json({
      data: {
        message: "success"
      },
    });
  } catch (error) {
    
    if (error) {
      // if Hasura operation errors, then throw error
      return res.status(400).json(error[0]);
    }
  }

  


};


const retriveInventoryId = async (detalle_orden, destination_zipcode, id_cliente) => {
  //[{cantidad, id_producto}] = detalle_orden
  //return [{cantidad, id_producto, id_inventario}]
  const HASURA_QUERY_INVENTORY = `
  query getProductInventoryId($cantidad: Int!, $id_producto: uuid!, $codigo_postal: String, $id_cliente: uuid = "") {
    inventario(limit: 1, order_by: {disponibles: desc}, where: {disponibles: {_gte: $cantidad}, _and: {almacenamiento: {almacen: {codigo_postal_almacens: {codigo_postal: {_eq: $codigo_postal}}}}}, producto: {id_producto: {_eq: $id_producto}, _and: {id_cliente: {_eq: $id_cliente}}}}) {
      id_inventario
    }
  }
  `;
  const detalle_products_with_inventories_by_pk = await Promise.all(detalle_orden.map( async detalle => {
    
    const { cantidad, id_producto } = detalle;

    const { data: inventory_response, errors } = await execute({
      cantidad,
      id_producto,
      codigo_postal: destination_zipcode,
      id_cliente
    }, HASURA_QUERY_INVENTORY);
    const inventory_by_pk = inventory_response.inventario[0];
    if (erros) {
      console.error(errors)
      throw new Error(errors)
    }
    if (data) {
      return { inventory_by_pk, ...detalle }
    }
  }));

  return detalle_products_with_inventories_by_pk;
}

const updateInventoryByPk = async (
  detalles_orden
) => {
  const HASURA_MUTATION_UPDATE_STOCK = `
  mutation updateStockBeforeOrder($cantidad: Int!, $id_inventario: uuid!) {
    update_inventario_by_pk(pk_columns: {id_inventario: $id_inventario}, _inc: {disponibles: $cantidad}) {
      id_producto
      disponibles
      en_inventario
    }
  }
  `;
  for (const detalle of detalles_orden) {
    const { cantidad, id_inventario } = detalle;
    const { data: update_stock_request } = await execute({ cantidad: -Math.abs(cantidad), id_inventario }, HASURA_MUTATION_UPDATE_STOCK);
    const updated_inventory_stock = update_stock_request.update_inventario_by_pk;

    if (!updated_inventory_stock) {
      throw new Error("Cannont update inventory");
    }
  }
}