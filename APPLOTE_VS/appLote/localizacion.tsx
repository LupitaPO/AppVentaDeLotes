export  const traslations={
    en:{
        // texto de login
        title:"Login",
        subtitle:"Lot sales application, Your secure lot",
        Email:"Email",
        pswd:"Password",
        btnLogin:"Login",
        register: "Don't have an account? Register here...",
        suport:"Can't access it? Contact us here.",
        // texto de login registro 
        Register:"Register:",
        iptNom:"Name",
        iptCor:"Email",
        iptCon:"Password",
        iptCel:"CellPhone",
        btnRegister:"Register User",
        Comeback:"Come back",
        // texto de login soporte de contraseña 
        titleSuport:"Click on any of our available        numbers:",
        msjbss:"Business hours 8:00am - 5:00pm.",
        Incharge:"In charge",
        // texto bottomtabs
        btDashboard:"Dashboard",
        btProyectos:"Projects",
        btusuario:"Users",
        btAsesor:"Advisors",
        btcliente:"Customers",
        btVentas:"Sales",
        // texto para el dashboard
        Dtitle:"Welcome:",
        Dmsj:"Sales Dashboard",
        Dmsj2:"Total Accounts Receivable",
        Dmsj3:"Occupation of Lots",
        card1:"Collected",
        card2:"Mora Today",
        card3:"Lots",
        card4:"Debts"
    },

    es:{
        // texto de login
        title:"Iniciar Sesion",
        subtitle:"Aplicativo de venta de Lotes, Tu lote seguro",
        Email:"correo",
        pswd:"contraseña",
        btnLogin:"Iniciar Sesion",
        register:"¿No tienes una cuenta?, Registrate aqui...",
        suport:"No puedes acceder?, Contactanos aqui.",
        // texto de login registro
        Register:"Registrate:",
        iptNom:"Nombre",
        iptCor:"Correo",
        iptCon:"Contraseña",
        iptCel:"Celular",
        btnRegister:"Registrar Usuario",
        Comeback:"Regresar",
        // texto de login soporte de contraseña 
        titleSuport:"Haz clik en cualquiera de nuestros numeros disponibles:",
        msjbss:"Horario de atencion 8:00am - 5:00pm.",
        Incharge:"Encargado",
        // texto bottomtabs
        btDashboard:"Panel",
        btProyectos:"Proyectos",
        btusuario:"Usuarios",
        btAsesor:"Asesores",
        btcliente:"Clientes",
        btVentas:"Ventas",
        // texto para el dashboard
        Dtitle:"Bienvenido",
        Dmsj:"Panel de Ventas",
        Dmsj2:"Cartera Total por Cobrar",
        Dmsj3:"Ocupación de Lotes",
        card1:"Recaudado",
        card2:"Mora Hoy",
        card3:"Lotes",
        card4:"Deudas",
    }
}

export type translationkeys=keyof typeof traslations.en;
export type Languages=keyof typeof traslations;