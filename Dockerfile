# 1. Usamos una imagen moderna de Java 21 (Eclipse Temurin es la que va ahora)
FROM eclipse-temurin:21-jdk-jammy

# 2. Creamos una carpeta para la app
WORKDIR /app

# 3. Copiamos el archivo .jar de la carpeta target a la imagen
COPY target/*.jar app.jar

# 4. Exponemos el puerto 8080
EXPOSE 8080

# 5. Comando para arrancar
ENTRYPOINT ["java", "-jar", "app.jar"]
