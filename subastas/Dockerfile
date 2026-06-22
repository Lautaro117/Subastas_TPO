# Build multi-stage: una etapa compila con Maven+JDK, la otra corre solo con el JRE
# (mucho mas liviana). Asume que el contexto de build es ESTA carpeta (subastas/, donde
# esta el pom.xml) -- en Render, "Root Directory" / "Docker Build Context Directory" tiene
# que apuntar aca.

# ---- Etapa 1: build ----
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copiar primero solo el pom.xml para cachear las dependencias en una capa separada
# (acelera builds siguientes si no cambiaron las dependencias).
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Etapa 2: runtime ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render setea PORT automaticamente; application.properties ya lo lee via ${PORT:8080}.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
