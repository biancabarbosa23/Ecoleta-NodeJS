import { request, Request, Response } from "express";
import Knex from "../database/connection";

class PointsController {
  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query;

    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await Knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parsedItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

    return res.json(points);
  }

  async show(req: Request, res: Response) {
    //pegando ID do parâmetro
    const { id } = req.params;

    //buscando o item a partir do ID
    const point = await Knex("points").where("id", id).first();

    if (!point) {
      return res.status(400).json({ message: "Point not found" });
    }

    //Retornar os itens relacionados ao ponto
    /*
    SELECT * FROM items
        JOIN point_items ON item.id = point_items.item_id
        WHERE point_items.point_id = id
    */
    const items = await Knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", id)
      .select("items.title");

    return res.json({ point, items });
  }

  async create(req: Request, res: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = req.body;

    //Só executa outro insert quando o restante der certo
    const trx = await Knex.transaction();

    const point = {
      image:
        "https://images.unsplash.com/photo-1583853269687-0daaa26b22de?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    //inserindo pontos
    const insertIds = await trx("points").insert(point);

    //pegando id do registro
    const point_id = insertIds[0];

    //cadastrando items linkado ao ponto
    const pointItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      };
    });

    await trx("point_items").insert(pointItems);

    //realizar os inserts
    await trx.commit();

    return res.json({ id: point_id, ...point });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = req.body;

    const trx = await Knex.transaction();

    const point = {
      image:
        "https://images.unsplash.com/photo-1583853269687-0daaa26b22de?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const pointUpdate = await trx("points").where("id", id).update(point);

    await trx("point_items").where("point_id", id).del();

    const pointItemsInsert = items.map((item_id: number) => {
      return {
        item_id,
        point_id: Number(id),
      };
    });

    await trx("point_items").insert(pointItemsInsert);

    await trx.commit();

    return res.json({ point, pointItemsInsert });
  }

  async destroy(req: Request, res: Response) {
    const { id } = req.params;

    const trx = await Knex.transaction();

    await trx("points").where("id", id).del();
    await trx("point_items").where("point_id", id).del();
    await trx.commit();

    return res.json({ sucess: true });
  }
}

export default PointsController;
