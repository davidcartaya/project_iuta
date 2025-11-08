import mysql.connector
from datetime import datetime, date
import sys

# ----------------------------------------------------------------------
# 1. CONFIGURACIÓN DE LA BASE DE DATOS
# ----------------------------------------------------------------------
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'agencia_viajes_db'
}

# ----------------------------------------------------------------------
# 2. UTILIDADES DE CONEXIÓN Y PRESENTACIÓN
# ----------------------------------------------------------------------

def get_db_connection():
    """Intenta establecer y devolver la conexión a la base de datos."""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        print(f"\n❌ ERROR de Conexión a la BD: {err}")
        print("Asegúrate de que MySQL y la base de datos 'agencia_viajes_db' estén corriendo.")
        return None

def describir_paquete(paquete):
    """Muestra los detalles de un paquete de forma clara y formateada."""
    if not paquete or len(paquete) < 7:
        print("⚠️ Datos de paquete incompletos o inválidos.")
        return
        
    id, nombre, ruta, fecha_viaje, precio, descripcion, imagen_url = paquete
    
    # Formateo de fecha y precio
    fecha_display = fecha_viaje.strftime('%d/%m/%Y') if isinstance(fecha_viaje, (datetime, date)) else str(fecha_viaje)
    precio_display = f"${precio:,.2f}"

    print("-" * 70)
    print(f"📦 ID del Paquete: {id}")
    print(f"  > Nombre: {nombre}")
    print(f"  > Ruta/Destino: {ruta}")
    print(f"  > Fecha de Viaje: {fecha_display} (Formato: Día/Mes/Año)")
    print(f"  > Precio: {precio_display} (Almacenado como entero)")
    print(f"  > Descripción: {descripcion[:80]}{'...' if len(descripcion) > 80 else ''}")
    print(f"  > URL Imagen: {imagen_url}")
    print("-" * 70)

# ----------------------------------------------------------------------
# 3. FUNCIONES CRUD
# ----------------------------------------------------------------------

# --- (R) LEER ---
def leer_paquetes():
    """Recupera y muestra todos los paquetes."""
    conn = get_db_connection()
    if conn is None:
        return

    cursor = conn.cursor()
    sql = "SELECT id, nombre, ruta, fecha_viaje, precio, descripcion, imagen_url FROM paquetes"
    
    try:
        cursor.execute(sql)
        paquetes = cursor.fetchall()
        
        print("\n====================================")
        print("       LISTA DE PAQUETES DE VIAJE     ")
        print("====================================")

        if not paquetes:
            print("No hay paquetes registrados.")
        else:
            for paquete in paquetes:
                describir_paquete(paquete)
                
    except mysql.connector.Error as err:
        print(f"❌ Error al leer paquetes: {err}")
    finally:
        cursor.close()
        conn.close()

# --- (C) CREAR ---
def crear_paquete():
    """Solicita datos al usuario e inserta un nuevo paquete."""
    print("\n--- CREAR NUEVO PAQUETE ---")
    
    try:
        nombre = input("Nombre (único): ").strip()
        ruta = input("Ruta/Destino: ").strip()
        
        # Validar Fecha
        fecha_str = input("Fecha de Viaje (YYYY-MM-DD): ").strip()
        fecha_viaje = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        # Validar Precio
        precio = int(input("Precio (solo números enteros, ej: 1200): "))
        
        descripcion = input("Descripción: ").strip()
        imagen_url = input("URL de la Imagen: ").strip()
        
    except ValueError as e:
        print(f"❌ Error de formato: {e}. Asegúrate de usar YYYY-MM-DD y números enteros para el precio.")
        return
    except Exception as e:
        print(f"❌ Error en la entrada de datos: {e}")
        return

    conn = get_db_connection()
    if conn is None:
        return

    cursor = conn.cursor()
    sql = "INSERT INTO paquetes (nombre, ruta, fecha_viaje, precio, descripcion, imagen_url) VALUES (%s, %s, %s, %s, %s, %s)"
    values = (nombre, ruta, fecha_viaje, precio, descripcion, imagen_url)
    
    try:
        cursor.execute(sql, values)
        conn.commit()
        print(f"\n✅ Paquete '{nombre}' creado con ID: {cursor.lastrowid}")
    except mysql.connector.Error as err:
        print(f"\n❌ Error al crear el paquete: {err}. ¿El nombre ya existe?")
    finally:
        cursor.close()
        conn.close()

# --- (U) ACTUALIZAR ---
def editar_paquete():
    """Permite modificar un paquete por su ID."""
    print("\n--- EDITAR PAQUETE ---")
    try:
        paquete_id = int(input("Ingrese el ID del paquete a editar: "))
    except ValueError:
        print("❌ Error: El ID debe ser un número entero.")
        return

    conn = get_db_connection()
    if conn is None:
        return
        
    cursor = conn.cursor()
    # 1. Obtener paquete actual
    cursor.execute("SELECT id, nombre, ruta, fecha_viaje, precio, descripcion, imagen_url FROM paquetes WHERE id = %s", (paquete_id,))
    paquete_actual = cursor.fetchone()

    if not paquete_actual:
        print(f"❌ Paquete con ID {paquete_id} no encontrado.")
        cursor.close()
        conn.close()
        return
        
    print("\nDetalles actuales del paquete:")
    describir_paquete(paquete_actual)
    print("\nIngrese nuevos valores (deje vacío para mantener el actual):")

    # 2. Recolectar nuevos datos (usando el valor actual si la entrada está vacía)
    # [0]=id, [1]=nombre, [2]=ruta, [3]=fecha_viaje, [4]=precio, [5]=descripcion, [6]=imagen_url
    
    nombre = input(f"Nuevo Nombre ({paquete_actual[1]}): ").strip() or paquete_actual[1]
    ruta = input(f"Nueva Ruta ({paquete_actual[2]}): ").strip() or paquete_actual[2]
    
    # Manejar fecha
    fecha_str = input(f"Nueva Fecha (YYYY-MM-DD) ({paquete_actual[3]}): ").strip()
    if fecha_str:
        try:
            fecha_viaje = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            print("❌ Error: Formato de fecha incorrecto. Se cancela la edición.")
            cursor.close()
            conn.close()
            return
    else:
        fecha_viaje = paquete_actual[3]
        
    # Manejar precio
    precio_str = input(f"Nuevo Precio ({paquete_actual[4]}): ").strip()
    if precio_str:
        try:
            precio = int(precio_str)
        except ValueError:
            print("❌ Error: El precio debe ser un número entero. Se cancela la edición.")
            cursor.close()
            conn.close()
            return
    else:
        precio = paquete_actual[4]

    descripcion = input(f"Nueva Descripción ({paquete_actual[5]}): ").strip() or paquete_actual[5]
    imagen_url = input(f"Nueva URL Imagen ({paquete_actual[6]}): ").strip() or paquete_actual[6]

    # 3. Ejecutar la actualización
    sql = "UPDATE paquetes SET nombre = %s, ruta = %s, fecha_viaje = %s, precio = %s, descripcion = %s, imagen_url = %s WHERE id = %s"
    values = (nombre, ruta, fecha_viaje, precio, descripcion, imagen_url, paquete_id)
    
    try:
        cursor.execute(sql, values)
        conn.commit()
        print(f"\n✅ Paquete con ID {paquete_id} actualizado exitosamente.")
    except mysql.connector.Error as err:
        print(f"\n❌ Error al actualizar el paquete: {err}")
    finally:
        cursor.close()
        conn.close()

# --- (D) BORRAR ---
def borrar_paquete():
    """Elimina un paquete de la BD por su ID con confirmación."""
    print("\n--- BORRAR PAQUETE ---")
    try:
        paquete_id = int(input("Ingrese el ID del paquete a borrar: "))
    except ValueError:
        print("❌ Error: El ID debe ser un número entero.")
        return

    confirmacion = input(f"⚠️ ¿Está seguro que desea borrar el paquete ID {paquete_id}? (s/N): ").lower()
    
    if confirmacion != 's':
        print("Operación de borrado cancelada.")
        return

    conn = get_db_connection()
    if conn is None:
        return
        
    cursor = conn.cursor()
    sql = "DELETE FROM paquetes WHERE id = %s"
    
    try:
        cursor.execute(sql, (paquete_id,))
        conn.commit()
        if cursor.rowcount > 0:
            print(f"\n✅ Paquete con ID {paquete_id} borrado exitosamente.")
        else:
            print(f"\n⚠️ Paquete con ID {paquete_id} no encontrado. No se borró nada.")
    except mysql.connector.Error as err:
        print(f"\n❌ Error al borrar el paquete: {err}")
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------------------------
# 4. FUNCIÓN PRINCIPAL Y MENÚ
# ----------------------------------------------------------------------
def mostrar_menu():
    """Muestra el menú de opciones."""
    print("\n=====================================")
    print(" GESTIÓN DE PAQUETES DE VIAJES (CRUD) ")
    print("=====================================")
    print("1. Crear Nuevo Paquete (C)")
    print("2. Ver Todos los Paquetes (R)")
    print("3. Editar Paquete por ID (U)")
    print("4. Borrar Paquete por ID (D)")
    print("5. Salir")
    print("-------------------------------------")

def main():
    """Ejecuta el programa interactivo."""
    # Verificación de librería al inicio
    if 'mysql.connector' not in sys.modules:
        print("ADVERTENCIA: La librería 'mysql.connector' no está cargada.")
        print("Asegúrate de instalarla: pip install mysql-connector-python")

    while True:
        mostrar_menu()
        opcion = input("Seleccione una opción (1-5): ").strip()

        if opcion == '1':
            crear_paquete()
        elif opcion == '2':
            leer_paquetes()
        elif opcion == '3':
            editar_paquete()
        elif opcion == '4':
            borrar_paquete()
        elif opcion == '5':
            print("\n👋 Saliendo del programa. ¡Hasta pronto!")
            break
        else:
            print("⚠️ Opción inválida. Intente de nuevo.")

if __name__ == "__main__":
    main()