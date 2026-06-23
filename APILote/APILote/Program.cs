var builder = WebApplication.CreateBuilder(args);

// ===============================================
// 1. ACTIVAR CORS
// Permite que tu API sea consumida desde cualquier frontend
// ===============================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ===============================================
// 2. AGREGAR CONTROLADORES
// Necesario para que funcionen tus Controllers
// ===============================================
builder.Services.AddControllers();

// ===============================================
// 3. ACTIVAR SWAGGER
// Necesario para ver la documentación en navegador
// ===============================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ===============================================
// 4. ACTIVAR SWAGGER SIEMPRE
// Así funciona en Development y también fuera de Development
// ===============================================
app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "API Venta de Lotes V1");
    options.RoutePrefix = "swagger";
});

// ===============================================
// 5. ACTIVAR CORS
// Debe ir antes de MapControllers
// ===============================================
app.UseCors("AllowAll");

// ===============================================
// 6. APLICACION WEB Y ARCHIVOS ESTATICOS
// Sirve index.html en / y conserva intactas las rutas de los controladores.
// ===============================================
app.UseDefaultFiles();
app.UseStaticFiles();

// ===============================================
// 7. AUTORIZACIÓN
// ===============================================
app.UseAuthorization();

// ===============================================
// 8. MAPEAR CONTROLLERS
// Aquí se conectan las rutas de tus controllers
// ===============================================
app.MapControllers();

// ===============================================
// 9. EJECUTAR API
// ===============================================
app.Run();
