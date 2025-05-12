import { Model, DataTypes, Sequelize, ModelStatic } from 'sequelize';
import { ICategory } from '../interfaces/category.interface';

// Definir un tipo de retorno explícito para la función
export default function(sequelize: Sequelize, dataTypes: typeof DataTypes): ModelStatic<Model<ICategory>> {
  class Category extends Model<ICategory> implements ICategory {
    // Propiedades del modelo
    public id!: number;
    public nombre!: string;
    public padre!: number;

    // Timestamps automáticos de Sequelize
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    /**
     * Método estático para definir asociaciones con otros modelos
     * @param models Objeto con todos los modelos disponibles
     */
    public static associate(models: any) {
      // Una categoría puede tener muchos productos
      Category.hasMany(models.Product, {
        foreignKey: 'categoria',
        as: 'products'
      });

      // Relación con categoría padre (autoreferencial)
      Category.belongsTo(Category, {
        foreignKey: 'padre',
        as: 'parentCategory'
      });

      // Relación con categorías hijas (autoreferencial)
      Category.hasMany(Category, {
        foreignKey: 'padre',
        as: 'childCategories'
      });
    }
  }

  // Inicializar el modelo con sus atributos y opciones
  Category.init(
    {
      // Definición de columnas
      id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: dataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      padre: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1, // -1 indica categoría sin padre
        comment: 'ID de la categoría padre. Si es principal, debe ser igual a su propio ID'
      }
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categoria', // Cambiado a 'categoria' para usar la tabla existente
      timestamps: false,
      // Hooks (ganchos) para operaciones automáticas
      hooks: {
        // Después de crear, si es categoría principal, establecer padre=id
        afterCreate: async (category: any) => {
          if (category.padre === -1) {
            await category.update({ padre: category.id });
          }
        }
      }
    }
  );

  return Category;
}