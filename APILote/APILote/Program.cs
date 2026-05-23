var builder = WebApplication.CreateBuilder(args);

// --- 1. AGREGAR ESTO PARA EVITAR BLOQUEOS DE CONEXIÓN ---
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", builder => {
        builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});
// -------------------------------------------------------


// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}
// --- 3. ACTIVAR LA POLÍTICA DE CONEXIÓN ---
app.UseCors("AllowAll");
// ------------------------------------------


app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();
