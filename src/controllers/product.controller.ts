/**
 * Controlador de Productos
 * Maneja la lógica de negocio para operaciones relacionadas con productos
 */
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../models';
import { IProduct } from '../interfaces/product.interface';

class ProductController {
  /**
   * Obtener todos los productos
   */
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const products = await db.Product.findAll({
        include: [{
          model: db.Category,
          as: 'categoryInfo'  // Cambiado de 'category' a 'categoryInfo'
        }]
      });

      // Mapear los productos para incluir carpetaimg automáticamente
      // Gracias al método toJSON() del modelo, ya se incluirá automáticamente
      const productsJson = products.map((product: any) => product.toJSON());

      console.log(`Total de productos encontrados: ${productsJson.length}`);
      
      return res.status(200).json(productsJson);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return res.status(500).json({ 
        message: 'Error al obtener productos', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener un producto por ID
   */
  async show(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      const product = await db.Product.findByPk(id, {
        include: [{
          model: db.Category,
          as: 'categoryInfo'  // Cambiado de 'category' a 'categoryInfo'
        }]
      });

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      // toJSON() ya incluye carpetaimg automáticamente
      return res.status(200).json(product.toJSON());
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return res.status(500).json({ 
        message: 'Error al obtener producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { categoryId } = req.params;
      
      const products = await db.Product.findAll({
        where: { categoria: categoryId },
        include: [{
          model: db.Category,
          as: 'categoryInfo'  // Cambiado de 'category' a 'categoryInfo'
        }]
      });

      // toJSON() ya incluye carpetaimg automáticamente
      const productsJson = products.map((product: any) => product.toJSON());

      console.log(`Productos encontrados para categoría ${categoryId}: ${productsJson.length}`);
      
      return res.status(200).json(productsJson);
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      return res.status(500).json({ 
        message: 'Error al obtener productos por categoría', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Crear producto
   */
  async store(req: Request, res: Response): Promise<Response> {
    try {
      const { nombre, descripcion, precio, categoria_id, imagen } = req.body;

      const newProduct = await db.Product.create({
        nombre,
        descripcion,
        precio,
        categoria_id,
        imagen
      });

      return res.status(201).json(newProduct.toJSON());
    } catch (error) {
      console.error('Error al crear producto:', error);
      return res.status(500).json({ 
        message: 'Error al crear producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualizar producto
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, categoria_id, imagen } = req.body;

      const product = await db.Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      await product.update({
        nombre,
        descripcion,
        precio,
        categoria_id,
        imagen
      });

      return res.status(200).json(product.toJSON());
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      return res.status(500).json({ 
        message: 'Error al actualizar producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Eliminar producto
   */
  async destroy(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const product = await db.Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      await product.destroy();

      return res.status(200).json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      return res.status(500).json({ 
        message: 'Error al eliminar producto', 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener Colors disponibles del producto
   */
  
  async getColors(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'ID de producto no válido' });
      }
      
      // Primero intentamos obtener colores específicos para este producto de la tabla lineapedido
      const colors = await db.sequelize.query(
        'SELECT DISTINCT color FROM lineapedido WHERE idprod = :productId',
        {
          replacements: { productId },
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      
      // Si no hay colores específicos para este producto, usamos todos los colores disponibles
      if (!colors || colors.length === 0) {
        const allColors = await db.sequelize.query(
          'SELECT id, nombre as color, codigo_color FROM product_colors',
          {
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        
        return res.status(200).json(allColors);
      }
      
      return res.status(200).json(colors);
    } catch (error) {
      console.error('Error al obtener colores del producto:', error);
      return res.status(500).json({ 
        message: 'Error al obtener colores', 
        error: (error as Error).message 
      });
    }
  }
  

  /**
   * Obtener imagen del producto
   */
  getImage(req: Request, res: Response): void {
    try {
      const { categoria, imagen } = req.params;
      const imagePath = path.join(__dirname, '../../public/images', categoria, imagen);

      if (!fs.existsSync(imagePath)) {
        res.status(404).json({ message: 'Imagen no encontrada' });
        return;
      }

      res.sendFile(imagePath);
    } catch (error) {
      console.error('Error al obtener imagen:', error);
      res.status(500).json({ 
        message: 'Error al obtener imagen', 
        error: (error as Error).message 
      });
    }
  }
}

export default new ProductController();