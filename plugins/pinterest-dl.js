const moment = require('moment-timezone');
const { cmd } = require('../command');

// Helper function to validate birth date
function validarFechaNacimiento(text) {
    const regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/
    if (!regex.test(text)) return null
    const [dia, mes, año] = text.split('/').map(n => parseInt(n))
    const fecha = moment.tz({ day: dia, month: mes - 1, year: año }, 'America/Caracas')
    if (!fecha.isValid()) return null
    const ahora = moment.tz('America/Caracas')
    const edad = ahora.diff(fecha, 'years')
    if (edad < 5 || edad > 120) return null
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    return `${dia} de ${meses[mes - 1]} de ${año}`
}

// Helper function to assign gender
function asignarGenre(text) {
    let genre
    switch (text.toLowerCase()) {
        case "hombre":
            genre = "Hombre"
            break
        case "mujer":
            genre = "Mujer"
            break
        default:
            return null
    }
    return genre
}

// Set Profile Main Command
cmd({
    pattern: "setprofile",
    alias: ["profilehelp"],
    react: "👤",
    desc: "Profile settings help",
    category: "profile",
    use: ".setprofile",
    filename: __filename
}, async (conn, mek, m, { from, reply, prefix }) => {
    return reply(`✦ Ingresa la categoría que quieras modificar.\n\n🜸 *_Categorías disponibles:_*\n\n*• ${prefix}setbirth _<01/01/2000|(dia/mes/año)>_*\n> *Establece tu fecha de cumpleaños.*\n*• ${prefix}delbirth*\n> *Borra tu fecha de cumpleaños establecida.*\n*• ${prefix}setgenre _<Hombre|Mujer>_*\n> *Establece tu género.*\n*• ${prefix}delgenre*\n> *Borra tu género establecido.*\n*• ${prefix}setdesc _<texto>_*\n> *Establece una descripción para tu perfil.*\n*• ${prefix}deldesc*\n> *Borra tu descripción establecida.*`)
})

// Set Birth Date Command
cmd({
    pattern: "setbirth",
    react: "🎂",
    desc: "Set your birth date",
    category: "profile",
    use: ".setbirth <dd/mm/yyyy>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, sender }) => {
    try {
        if (!q) return reply(`❀ Debes ingresar una fecha válida para tu cumpleaños.\n\n> ✐ Ejemplo » *${prefix}setbirth 01/01/2000* (día/mes/año)`)
        
        const birth = validarFechaNacimiento(q)
        if (!birth) {
            return reply(`ꕥ La fecha ingresada no es válida o no tiene lógica.\n> Ejemplo: *${prefix}setbirth 01/12/2000*`)
        }
        
        // Store in database (you need to implement your database logic)
        // user.birth = birth
        return reply(`❀ Se ha establecido tu fecha de nacimiento como: *${birth}*!`)
        
    } catch (error) {
        console.error('Set Birth Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Delete Birth Date Command
cmd({
    pattern: "delbirth",
    react: "🗑️",
    desc: "Delete your birth date",
    category: "profile",
    use: ".delbirth",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        // Check if user has birth date in database
        // if (!user.birth) {
        //     return reply(`ꕥ No tienes una fecha de nacimiento establecida que se pueda eliminar.`)
        // }
        
        // Delete from database
        // user.birth = ''
        return reply(`❀ Tu fecha de nacimiento ha sido eliminada.`)
        
    } catch (error) {
        console.error('Delete Birth Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Set Gender Command
cmd({
    pattern: "setgenre",
    alias: ["setgenero"],
    react: "⚧️",
    desc: "Set your gender",
    category: "profile",
    use: ".setgenre <hombre|mujer>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`❀ Debes ingresar un género válido.\n> Ejemplo » *${prefix}setgenre hombre*`)
        
        let genre = asignarGenre(q)
        if (!genre) {
            return reply(`ꕥ Recuerda elegir un género válido.\n> Ejemplo: ${prefix}setgenre hombre`)
        }
        
        // Check if already has same gender
        // if (user.genre === genre) {
        //     return reply(`ꕥ Ya tienes establecido el género como *${user.genre}*.`)
        // }
        
        // Store in database
        // user.genre = genre
        return reply(`❀ Se ha establecido tu género como: *${genre}*!`)
        
    } catch (error) {
        console.error('Set Gender Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Delete Gender Command
cmd({
    pattern: "delgenre",
    react: "🗑️",
    desc: "Delete your gender",
    category: "profile",
    use: ".delgenre",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        // Check if user has gender in database
        // if (!user.genre) {
        //     return reply(`ꕥ No tienes un género asignado.`)
        // }
        
        // Delete from database
        // user.genre = ''
        return reply(`❀ Se ha eliminado tu género.`)
        
    } catch (error) {
        console.error('Delete Gender Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Set Description Command
cmd({
    pattern: "setdesc",
    alias: ["setdescription"],
    react: "📝",
    desc: "Set your profile description",
    category: "profile",
    use: ".setdesc <text>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`❀ Debes especificar una descripción válida para tu perfil.\n\n> ✐ Ejemplo » *${prefix}setdesc Hola, uso WhatsApp!*`)
        
        // Store in database
        // user.description = q
        return reply(`❀ Se ha establecido tu descripcion, puedes revisarla con #profile ฅ^•ﻌ•^ฅ`)
        
    } catch (error) {
        console.error('Set Description Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})

// Delete Description Command
cmd({
    pattern: "deldesc",
    alias: ["deldescription"],
    react: "🗑️",
    desc: "Delete your profile description",
    category: "profile",
    use: ".deldesc",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        // Check if user has description in database
        // if (!user.description) {
        //     return reply(`ꕥ No tienes una descripción establecida que se pueda eliminar.`)
        // }
        
        // Delete from database
        // user.description = ''
        return reply(`❀ Tu descripción ha sido eliminada.`)
        
    } catch (error) {
        console.error('Delete Description Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})
