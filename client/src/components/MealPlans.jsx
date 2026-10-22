import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';

const GROUPS = [
  'Verduras',
  'Frutas',
  'Cereales y tubérculos sin grasa',
  'Cereales y tubérculos con grasa',
  'Leguminosas',
  'Alimentos de origen animal muy bajos en grasa',
  'Alimentos de origen animal bajos en grasa',
  'Alimentos de origen animal moderados en grasa',
  'Alimentos de origen animal altos en grasa',
  'Leche',
  'Grasas sin proteína',
  'Grasas con proteína',
  'Azúcares sin grasa',
  'Azúcares con grasa',
  'Alimentos libres en energía',
  'Bebidas',
  'Otro',
];

const VEGETABLE_PORTIONS = {
  'Acelga cocida': '1/2 taza', 'Acelga cruda': '2 tazas', 'Alcachofa': '1 pieza', 'Apio cocido': '1/2 taza', 'Apio crudo': '2 tazas',
  'Champiñón cocido rebanado': '1 taza', 'Champiñón crudo entero': '1 taza', 'Chilacas': '3 piezas', 'Chilacayote': '1/2 taza', 'Cilantro': '2 tazas',
  'Col cruda': '1 1/2 taza', 'Colecita de bruselas': '3 piezas', 'Coliflor cocida': '1 taza', 'Ejotes cocidos picados': '1/2 taza', 'Espárragos crudos': '6 piezas',
  'Espinaca cocida': '1/2 taza', 'Espinaca cruda': '2 tazas', 'Flor de calabaza cocida': '1 taza', 'Flor de Maguey': '60 gramos', 'Huitlacoche cocido': '5 cucharadas',
  'Lechuga': '3 tazas', 'Nabo': '1/2 taza', 'Nopal Cocido': '1 taza', 'Nopal Crudo': '2 piezas', 'Nopal de Cambray': '4 piezas', 'Papaloquelite': '2 tazas',
  'Pepino rebanado': '1 1/2 taza', 'Pimiento morrón (rojo, amarillo, verde)': '1 pieza', 'Rábano': '1 taza', 'Salsa mexicana, pico de gallo, taquera, roja o verde': '1/2 taza',
  'Setas cocidas': '1/2 taza', 'Tomate Verde': '5 piezas', 'Berenjena': '1 taza', 'Berro cocido': '1 taza', 'Berro crudo': '1 taza', 'Betabel rallado': '1/4 taza',
  'Brócoli cocido': '1/2 taza', 'Brocoli crudo': '1 taza', 'Calabacita alargada ó redonda cruda': '1 pieza', 'Calabacita cocida': '1/2 taza', 'Calabaza de castilla cocida': '1/2 taza',
  'Cebolla blanca rebanada cruda': '1/2 taza', 'Cebolla cocida': '1/4 taza', 'Cebolla de cambray': '3 piezas', 'Chayote cocido': '1/2 pieza', 'Chepil': '1/4 taza',
  'Chícharo': '3 cucharadas', 'Chicoria': '1/2 taza', 'Chile de árbol': '4 piezas', 'Chile Habanero': '6 piezas', 'Chile Jalapeño': '6 piezas', 'Chile Poblano': '1/2 pieza',
  'Germen de Alfafa': '3 tazas', 'Germen de lenteja': '1/4 taza', 'Huazontle': '1/2 taza', 'Jicama picada': '1/2 taza', 'Jitomate bola': '1 pieza', 'Jitomate cereza': '4 piezas',
  'Jugo de tomate natural': '1/2 taza', 'Jugo de verduras': '1/2 taza', 'Jugo de zanahoria': '1/4 taza', 'Pepinillos': '1/2 taza', 'Poro crudo': '1/4 taza', 'Puré de tomate': '1/4 taza',
  'Quelite': '1/2 taza', 'Romeritos cocidos': '1 taza', 'Romeritos crudos': '1/2 taza', 'Verdolagas': '1 taza', 'Xoconostle': '3 piezas', 'Zanahoria miniatura': '3 piezas', 'Zanahoria Picada o rallada': '1/2 taza',
};
const FRUIT_PORTIONS = {
  'Agua de coco': '1 1/2 taza', 'Arándano': '1/2 taza', 'Capulín': '3 tazas', 'Carambolo': '1 1/2 pieza', 'Chabacano': '4 piezas',
  'Chicozapote': '1/2 pieza', 'Chirimoya': '1/3 pieza', 'Ciruela': '3 piezas', 'Ciruela pasa deshuesada': '7 piezas', 'Dátil': '2 piezas',
  'Durazno (chico)': '2 piezas', 'Frambuesa': '1 taza', 'Fresa rebanada': '1 taza', 'Fruta picada': '1 taza', 'Gajos de mandarina, toronja y naranja': '1 taza',
  'Granada china': '2 piezas', 'Granada roja': '1 pieza', 'Guanábana': '1 pieza', 'Guayaba': '3 piezas', 'Guayaba rosa': '1 pieza', 'Higo': '2 piezas',
  'Jugo de naranja, toronja o mandarina natural': '1/2 taza', 'Kiwi': '1 1/2 pieza', 'Lichis': '12 piezas', 'Lima': '3 piezas', 'Limón real': '4 piezas',
  'Mamey': '1/3 pieza', 'Mandarina (chica)': '2 piezas', 'Mandarina reina': '1 pieza', 'Mango ataulfo': '1/2 pieza', 'Mango petacón': '1/2 pieza',
  'Manzana (chica)': '1 pieza', 'Melón picado': '1 taza', 'Nanche': '2 tazas', 'Naranja': '1 pieza', 'Nectarina': '1 pieza', 'Níspero': '25 piezas',
  'Papaya hawaiana': '1/2 pieza', 'Papaya picada': '1 taza', 'Pasas': '10 piezas', 'Pera': '1/2 pieza', 'Perón': '1 pieza', 'Piña picada': '3/4 taza',
  'Plátano dominico': '3 piezas', 'Plátano macho': '1/4 pieza', 'Plátano tabasco': '1/2 pieza', 'Sandía picada': '1 taza', 'Tangerina': '2 piezas',
  'Tejocote': '2 piezas', 'Toronja': '1 pieza', 'Tuna': '2 piezas', 'Uva roja o verde': '15 piezas', 'Zapote negro': '1/2 pieza', 'Zarzamora': '1 taza',
};
const CEREAL_PORTIONS = {
  'Cereales y tubérculos sin grasa': {
    'Amaranto tostado': '1/4 taza', 'Avena en hojuelas': '1/3 taza', 'Avena Cocida': '3/4 taza', 'Arroz blanco o integral cocido': '1/2 taza',
    'Baguette': '1/4 pieza', 'Barrita de granola o avena': '1/2 pieza', 'Bolillo sin migajón': '1/2 pieza', 'Bollo de hamburguesa': '1/2 pieza',
    'Camote': '1/4 pieza', 'Canelones': '4 piezas', 'Cáscara de papa sin freir': '3 tazas', 'Cereal de caja con azúcar': '1/3 taza',
    'Cereal de caja sin azúcar': '1/2 taza', 'Crepas': '2 piezas', 'Elote cocido': '1 1/2 pieza', 'Elote blanco desgranado': '1/2 taza',
    'Galleta de animalitos': '6 piezas', 'Galletas habaneras': '4 piezas', 'Galleta María': '5 piezas', 'Galleta para sopa': '15 piezas',
    'Galleta salada': '4 piezas', 'Granola con fruta seca, baja en grasa': '3 cucharadas', 'Harina de arroz': '2 cucharadas', 'Harina de maíz para atole': '2 cucharadas',
    'Hot cake (1 pieza chica)': '1 pieza', 'Maicena de sabor': '2 cucharadas', 'Maíz (blanco, cacahuazintle, palomero)': '22 gramos', 'Masa de maíz': '50 gramos',
    'Palitos de pan': '3 piezas', 'Palomitas naturales': '3 tazas', 'Pan para hot dog (media noche)': '1/2 pieza', 'Pan árabe': '1/2 pieza',
    'Pan birote': '1/2 pieza', 'Pan de caja (blanco, integral, multigrano)': '1/2 pieza', 'Pan molido': '4 cucharadas', 'Pan tostado': '1 pieza',
    'Papa (hervida o al horno)': '1/2 pieza', 'Papa cambray': '5 piezas', 'Pasta hervida (fideo, espagueti, lasaña, etc.)': '1/2 pieza',
    'Peneques (sin freír)': '2 piezas', 'Tlacoyo (sin freír)': '1 pieza', 'Tortilla de maíz': '1 pieza', 'Tortilla de maíz azul': '1 pieza',
    'Tortilla de harina': '1/2 pieza', 'Tortilla de harina light': '1 pieza', 'Tostada horneada': '1 pieza', 'Salvado de maíz': '6 cucharadas',
    'Salvado de trigo': '8 cucharadas', 'Yuca': '1/4 pieza',
  },
  'Cereales y tubérculos con grasa': {
    'Barra de granola': '1/2 pieza', 'Chicharrón de harina enchilado': '20 gramos', 'Frituras de maíz': '1/3 de bolsa',
    'Galleta con chispas de chocolate': '3 piezas', 'Galleta de avena con pasas': '2 piezas', 'Galleta integral con miel': '4 piezas',
    'Galleta tipo sándwich': '2 piezas', 'Palomitas con mantequilla': '1 taza', 'Pan dulce (bisquet, cuernito, o concha)': '1 pieza',
    'Panqué': '4 piezas', 'Papas fritas': '6 piezas', 'Papas fritas reducidas en grasa': '1 bolsa', 'Puré de papa preparado': '1/2 taza',
    'Roles de canela ó pasas': '1/3 piezas', 'Tamal': '1/4 pieza', 'Tostada': '1 pieza', 'Totopos y nachos': '4 piezas', 'Waffle': '1 pieza',
  },
};
const ANIMAL_PORTIONS = {
  'Alimentos de origen animal muy bajos en grasa': {
    'Abulón fresco': '50 gramos', 'Acociles': '50 gramos', 'Aguayón': '30 gramos', 'Almeja fresca': '4 piezas', 'Atún en agua': '40 gramos',
    'Bacalao seco': '1 cucharada', 'Bagre': '80 gramos', 'Bistec de res': '30 gramos', 'Blanco de nilo': '40 gramos', 'Cabeza de pescado': '400 gramos',
    'Cabrito': '30 gramos', 'Calamar': '50 gramos', 'Camarón cocido': '5 piezas', 'Camarón gigante': '2 piezas', 'Camarón pacotilla': '6 piezas',
    'Camarón seco': '1 cucharada', 'Cangrejo': '2 piezas', 'Carne de avestruz': '40 gramos', 'Carne de jaiba': '40 gramos', 'Carne de res seca': '1 cucharada',
    'Carne molida de pollo y pavo': '30 gramos', 'Cazón': '60 gramos', 'Chambarete': '40 gramos', 'Charales frescos': '30 gramos', 'Charales secos': '1 cucharada',
    'Clara de huevo': '2 piezas', 'Cuete de res': '50 gramos', 'Escalopa de res': '30 gramos', 'Escamoles': '80 gramos', 'Fajitas de pollo sin piel': '30 gramos',
    'Falda de res': '40 gramos', 'Filete de guachinango': '40 gramos', 'Filete de pescado, mero, mojarra, merluza': '40 gramos', 'Filete de res y tampiqueña': '30 gramos',
    'Guachinango': '70 gramos', 'Jaiba cocida entera': '80 gramos', 'Jugo de almeja': '3 tazas', 'Liebre': '50 gramos', 'Machaca': '1 cucharada',
    'Maciza de res': '30 gramos', 'Medallón de filete de res': '1/3 pieza', 'Mejillones': '30 gramos', 'Milanesa de pollo y res': '30 gramos',
    'Molida de pollo': '30 gramos', 'Molleja de pollo': '30 gramos', 'Muslo de pollo sin piel': '1/2 pieza', 'Pancita de res': '50 gramos', 'Pargo': '70 gramos',
    'Pata de res': '120 gramos', 'Pechuga a la plancha, asada, cocida': '30 gramos', 'Pechuga de pavo': '2 rebanadas', 'Pechuga de pollo deshuesada': '30 gramos',
    'Pescado en trozo': '80 gramos', 'Pierna de pollo sin piel': '1/4 pieza', 'Puntas de res': '30 gramos', 'Queso cottage': '3 cucharadas', 'Requesón': '2 cucharadas',
    'Riñones de res': '30 gramos', 'Róbalo': '30 gramos', 'Surimi': '2/3 barra', 'Tampiqueña': '30 gramos', 'Venado cocido': '',
  },
  'Alimentos de origen animal bajos en grasa': {
    'Falda de cerdo': '40 gramos', 'Filete de cerdo': '40 gramos', 'Filete de salmón': '30 gramos / 2 cucharadas', 'Guajolote de Pavo': '45 gramos',
    'Hígado de pollo': '30 gramos / 2 cucharadas', 'Hígado de res': '30 gramos / 2 cucharadas', 'Jamón de pavo y/o pierna': '2 rebanadas', 'Lomo de cerdo': '40 gramos',
    'Maciza de res': '15 gramos', 'Molida de cerdo': '40 gramos', 'Molida de res (sirloin)': '30 gramos / 2 cucharadas', 'Ostión': '75 gramos',
    'Ostión en lata': '100 gramos', 'Pescuezo de pollo s/piel': '4 piezas', 'Pierna de cerdo': '40 gramos', 'Queso de cabra': '30 gramos / 2 cucharadas',
    'Queso fresco': '40 gramos', 'Queso panela': '40 gramos', 'Salmón': '30 gramos / 2 cucharadas', 'Trucha cocida': '30 gramos / 2 cucharadas',
  },  'Alimentos de origen animal moderados en grasa': {
    'Bistec de bola': '25 gramos', 'Carne de suadero': '29 gramos', 'Chicharrón': '12 gramos', 'Costillas de cerdo': '50 gramos', 'Gusanos de maguey': '35 gramos',
    'Huevo': '1 pieza', 'Longaniza': '45 gramos', 'Pecho de res': '50 gramos', 'Queso mozarella': '30 gramos', 'Queso parmesano': '3 1/2 cucharadas',
    'Salami de pavo': '6 rebanadas', 'Salchicha de cerdo': '3/4 pieza', 'Salchicha de pavo': '1 pieza', 'Sardina en aceite': '3 piezas',
    'Sardinas en Tomate': '1 pieza', 'Sierra': '50 gramos', 'Suadero': '29 gramos',
  },
  'Alimentos de origen animal altos en grasa': {
    'Alón de pollo con piel cocido': '3/4 pieza', 'Cerdo en canal': '40 gramos', 'Costilla de res': '40 gramos', 'Espaldilla': '45 gramos', 'Lengua de cerdo': '30 gramos',
    'Maciza de cerdo': '35 gramos', 'Moronga': '1 rebanada', 'Mortadela': '1 1/2 rebanada', 'Nuggets de pollo': '2 piezas', 'Ostión ahumado': '55 gramos',
    'Palitos de pescado congelados': '1 1/2 pieza', 'Paloma': '45 gramos', 'Pastel de pavo y puerco': '1 1/2 rebanada', 'Pepperoni': '10 rebanadas',
    'Pollo rostizado': '50 gramos', 'Queso amarillo': '2 rebanadas', 'Queso americano': '1 rebanada', 'Queso asadero': '1 rebanada', 'Queso blanco': '40 gramos',
    'Queso canasto': '30 gramos', 'Queso chihuahua': '25 gramos', 'Queso fundido': '1/4 taza', 'Queso gouda': '30 gramos', 'Queso manchego': '25 gramos',
    'Queso Oaxaca': '30 gramos', 'Retazo de pollo': '350 gramos', 'Salchicha': '3/4 pieza', 'Sesos de cerdo': '50 gramos', 'Sesos de res': '60 gramos',
    'Tripas de res': '55 gramos', 'Yema de huevo': '2 piezas',
  },
};
const OTHER_PORTIONS = {
  Leguminosas: {
    'Alubias, garbanzos, habas, lentejas cocidas': '1/2 taza', 'Alverjón': '1/2 taza', 'Frijol canario, negro cocido': '1/2 taza',
    'Soya cocida': '1/3 taza', 'Soya texturizada seca': '35 gramos',
  },
  Leche: {
    'Leche de soya baja en grasa': '1 taza', 'Leche descremada': '1 taza', 'Leche en polvo descremada': '4 cucharadas', 'Leche evaporada descremada': '1/2 taza',
    'Yogurt light': '3/4 taza', 'Yogurt para beber bajo en grasa y azúcar': '1 pieza', 'Leche en polvo': '4 cucharadas', 'Leche entera': '1 taza',
    'Leche evaporada': '1/4 taza', 'Leche liconsa en polvo': '4 cucharadas', 'Leche liconsa liquida': '1/4 taza', 'Yogurt natural': '1 taza',
    'Yogurt para beber con fruta': '1 taza',
  },  'Alimentos libres en energía': {
    'Achiote': '1/4 cucharada', 'Agua mineral': '1 taza', 'Ajo en polvo': '1/2 cucharadita', 'Alcaparras**': '2 cucharadas',
    'Café americano descafeinado': '1 taza', 'Caldo de pollo / res, desgrasado**': '1/2 taza', 'Canela en polvo': '1 cucharadita', 'Chicles sin azúcar': '1 pieza',
    'Chile en polvo': '1/2 cucharadita', 'Cocoa en polvo, con sustituto de azúcar': '1 cucharada', 'Consomé de pollo /res /camarón en polvo**': '1/5 cucharadita',
    'Eneldo': '5 cucharaditas', 'Flor de jamaica': '1 taza', 'Gelatina baja en calorías': '1/4 taza', 'Hierbabuena': '10 gramos', 'Hierbas de olor': '1 cucharadita',
    'Hojas de laurel': '1 cucharadita', 'Limón': '1/2 pieza', 'Manzanilla': '10 gramos', 'Mejorana': '1 cucharadita', 'Mostaza': '1 cucharadita',
    'Orégano': '1 cucharadita', 'Pimienta': '1 cucharadita', 'Refrescos de dieta': '1 lata', 'Romero': '1 cucharadita', 'Sal de ajo**': '1 cucharadita',
    'Sal**': '1 cucharadita', 'Salsa de barbecue': '1/2 cucharadita', 'Salsa de soya**': '1/2 cucharadita', 'Salsa inglesa': '1/2 cucharadita',
    'Salsa Tabasco': '1 cucharadita', 'Salsa teriyaki **': '1 cucharadita', 'Sustituto de azúcar': 'Sin restricción en cuanto a calorías',
    'Té sin azúcar (manzanilla, canela, hierbabuena, jamaica)': 'Sin restricción en cuanto a calorías', 'Tomillo': '1 cucharadita', 'Vainilla': '1 cucharadita', 'Vinagre': '1 cucharadita',
  },  'Grasas sin proteína': {
    'Aceite de canola, soya, oliva': '1 cucharadita', 'Aceite de girasol, maíz, cártamo': '1 cucharadita', 'Aceite en spray': '5 disparos de 1 segundo',
    'Chilorio de pavo': '2 1/2 cucharadas', 'Chistorra': '1 cucharada', 'Chorizo': '1 cucharada', 'Chorizo de pavo': '2 cucharadas', 'Coco': '8 gramos',
    'Coco rallado': '1 1/2 cucharadas', 'Crema': '1 cucharada', 'Crema ácida': '2 cucharadas', 'Crema chantilly': '1 1/2 cucharadas', 'Crema para café': '1 cucharada',
    'Manteca de cerdo vegetal': '1 cucharadita', 'Mantequilla': '1 1/2 cucharaditas', 'Margarina baja en grasa': '2 cucharaditas', 'Media crema': '2 cucharadas',
    'Mole poblano en pasta': '1 cucharadita', 'Paté de cerdo': '1 cucharada', 'Paté de ganso': '1 cucharada', 'Paté de pollo': '1 cucharada',
    'Pepperoni': '4 rebanadas', 'Queso crema': '1 cucharada', 'Queso de puerco': '20 gramos', 'Tocino en tira': '1 rebanada',
  },
  'Grasas con proteína': {
    'Pepitas sin cáscara': '1 cucharada', 'Piñón': '1 cucharadita', 'Aceituna negra': '6 piezas', 'Aceituna verde': '6 piezas', 'Aguacate': '1/3 pieza', 'Ajonjolí': '4 cucharaditas', 'Almendras': '10 piezas',
    'Avellana': '9 piezas', 'Cacahuates': '14 piezas', 'Cacahuates con cáscara': '12 gramos', 'Guacamole': '2 cucharadas', 'Mayonesa': '1 cucharadita',
    'Nuez': '3 piezas', 'Nuez de la india': '7 piezas', 'Pistaches': '18 piezas',
  },
};
const FOOD_SUGGESTIONS = {
  Verduras: Object.keys(VEGETABLE_PORTIONS),
  Frutas: Object.keys(FRUIT_PORTIONS),
  'Cereales y tubérculos sin grasa': Object.keys(CEREAL_PORTIONS['Cereales y tubérculos sin grasa']),
  'Cereales y tubérculos con grasa': Object.keys(CEREAL_PORTIONS['Cereales y tubérculos con grasa']),
  Leguminosas: Object.keys(OTHER_PORTIONS.Leguminosas),
  'Alimentos de origen animal muy bajos en grasa': Object.keys(ANIMAL_PORTIONS['Alimentos de origen animal muy bajos en grasa']),
  'Alimentos de origen animal bajos en grasa': Object.keys(ANIMAL_PORTIONS['Alimentos de origen animal bajos en grasa']),
  'Alimentos de origen animal moderados en grasa': Object.keys(ANIMAL_PORTIONS['Alimentos de origen animal moderados en grasa']),
  'Alimentos de origen animal altos en grasa': Object.keys(ANIMAL_PORTIONS['Alimentos de origen animal altos en grasa']),
  Leche: Object.keys(OTHER_PORTIONS.Leche),
  'Grasas sin proteína': Object.keys(OTHER_PORTIONS['Grasas sin proteína']),
  'Grasas con proteína': Object.keys(OTHER_PORTIONS['Grasas con proteína']),
  'Azúcares sin grasa': ['Azúcar', 'Miel', 'Mermelada'],
  'Azúcares con grasa': ['Chocolate', 'Cajeta', 'Helado'],
  'Alimentos libres en energía': Object.keys(OTHER_PORTIONS['Alimentos libres en energía']),
  Bebidas: ['Agua', 'Café sin azúcar', 'Té sin azúcar'],
};

const MEALS = ['Desayuno', 'Colación matutina', 'Comida', 'Colación vespertina', 'Cena'];
const PORTION_OPTIONS = ['1 taza', '½ taza', '¼ taza', '1 pieza', '2 piezas', '100 g', '50 g', '30 g', '1 cucharada', '1 cucharadita', '1 rebanada', '1 vaso', '240 ml'];
const today = () => new Date().toISOString().slice(0, 10);
const emptyFood = () => ({ name: '', group: GROUPS[0], portion: '', equivalents: '' });
const emptyMeal = (name = 'Nuevo tiempo') => ({ name, time: '', foods: [emptyFood()] });
const emptyForm = (startDate = today()) => ({ title: 'Plan de alimentación', startDate, meals: [emptyMeal(MEALS[0]), emptyMeal(MEALS[2]), emptyMeal(MEALS[4])], notes: '' });

function asDate(value) {
  return new Date(value).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
}

function groupColor(group) {
  if (group.startsWith('Alimentos de origen animal')) return '#b91c1c';
  if (group === 'Frutas' || group === 'Verduras') return '#15803d';
  if (group.startsWith('Cereales y')) return '#e85d04';
  if (group === 'Leguminosas') return '#7c3f16';
  if (group.startsWith('Grasas')) return '#b8860b';
  if (group.startsWith('Alimentos libres')) return '#6b21a8';
  if (group === 'Leche') return '#1d4ed8';
  return '#30483b';
}
function formatPortion(portion) {
  const value = String(portion || '');
  const multiplied = value.match(/^(\d+(?:\.\d+)?) x (.*)$/);
  const multiplier = multiplied ? Number(multiplied[1]) : 1;
  const base = multiplied ? multiplied[2] : value;
  const glyphs = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚' };
  function formatAmount(amount) {
    const whole = Math.floor(amount + 0.000001);
    const fraction = amount - whole;
    if (fraction < 0.0001) return String(whole);
    let best = null;
    for (let denominator = 2; denominator <= 12; denominator += 1) {
      const numerator = Math.round(fraction * denominator);
      if (numerator > 0 && Math.abs(fraction - numerator / denominator) < 0.015) {
        best = `${numerator}/${denominator}`;
        break;
      }
    }
    const fractionText = best ? (glyphs[best] || best) : Number(fraction.toFixed(2)).toString().replace(/^0/, '');
    return whole ? `${whole}${fractionText}` : fractionText;
  }
  return base.replace(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/g, (quantity) => {
    const mixed = quantity.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    const fraction = quantity.match(/^(\d+)\/(\d+)$/);
    const amount = mixed ? Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]) : fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(quantity);
    return formatAmount(amount * multiplier);
  });
}
function displayGroup(group) {
  if (group === 'Cereales y tubérculos sin grasa') return 'Cereales y tubérculos · SIN GRASA';
  if (group === 'Cereales y tubérculos con grasa') return 'Cereales y tubérculos · CON GRASA';
  return group;
}

function equivalentTotals(meals = []) {
  const totals = {};
  meals.forEach((meal) => meal.foods?.forEach((food) => {
    if (!food.group || !food.name) return;
    totals[food.group] = (totals[food.group] ?? 0) + Number(food.equivalents || 0);
  }));
  return Object.entries(totals).filter(([, amount]) => amount > 0);
}

export default function MealPlans({ patientId, defaultStartDate, consultationContext = false }) {
  const [plans, setPlans] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [foodDraft, setFoodDraft] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeFood, setActiveFood] = useState('');
  const [activeGroup, setActiveGroup] = useState('');
  const [activePortion, setActivePortion] = useState('');
  const [customPortion, setCustomPortion] = useState('');

  async function loadPlans() {
    try {
      const response = await api.get(`/patients/${patientId}/meal-plans`);
      setPlans(response.data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudieron cargar los planes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, [patientId]);

  useEffect(() => {
    api.get('/patients/meal-foods').then(({ data }) => setCustomFoods(data)).catch(() => {});
  }, []);

  function startNew() {
    setForm(emptyForm(defaultStartDate || today()));
    setEditingId(null);
    setFoodDraft(null);
    setActiveFood('');
    setActiveGroup('');
    setActivePortion('');
    setError('');
    setOpen(true);
  }

  function editPlan(plan) {
    setForm({ title: plan.title, startDate: plan.startDate.slice(0, 10), meals: plan.content?.meals ?? [], notes: plan.content?.notes ?? '' });
    setEditingId(plan.id);
    setFoodDraft(null);
    setActiveFood('');
    setActiveGroup('');
    setActivePortion('');
    setError('');
    setOpen(true);
  }

  function closeEditor() {
    setOpen(false);
    setFoodDraft(null);
    setActiveFood('');
    setActiveGroup('');
    setActivePortion('');
  }

  function updateMeal(mealIndex, field, value) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, [field]: value } : meal) }));
  }

  function updateFood(mealIndex, foodIndex, field, value) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => {
      if (j !== foodIndex) return food;
      const updated = { ...food, [field]: value };
      const savedFood = customFoods.find((item) => item.name === food.name && item.group === food.group);
      const basePortion = savedFood?.portion ?? (food.group === 'Verduras' ? VEGETABLE_PORTIONS[food.name] : food.group === 'Frutas' ? FRUIT_PORTIONS[food.name] : CEREAL_PORTIONS[food.group]?.[food.name] ?? ANIMAL_PORTIONS[food.group]?.[food.name] ?? OTHER_PORTIONS[food.group]?.[food.name]);
      const baseEquivalents = Number(savedFood?.equivalents ?? 1);
      if (basePortion && field === 'equivalents' && value !== '') updated.portion = Number(value) === baseEquivalents ? basePortion : `${Number(value) / baseEquivalents} x ${basePortion}`;
      if (basePortion && field === 'portion' && value === basePortion) updated.equivalents = String(baseEquivalents);
      return updated;
    }) } : meal) }));
  }

  function adjustEquivalents(mealIndex, foodIndex, delta) {
    const current = Number(form.meals[mealIndex]?.foods[foodIndex]?.equivalents || 0);
    const next = Math.min(100, Math.max(0, Number((current + delta).toFixed(2))));
    updateFood(mealIndex, foodIndex, 'equivalents', String(next));
  }
  function selectFood(mealIndex, foodIndex, name) {
    const group = form.meals[mealIndex]?.foods[foodIndex]?.group;
    const savedFood = customFoods.find((item) => item.name === name && item.group === group);
    const portion = savedFood?.portion ?? (group === 'Verduras' ? VEGETABLE_PORTIONS[name] : group === 'Frutas' ? FRUIT_PORTIONS[name] : CEREAL_PORTIONS[group]?.[name] ?? ANIMAL_PORTIONS[group]?.[name] ?? OTHER_PORTIONS[group]?.[name]) ?? '';
    const equivalents = portion ? String(savedFood?.equivalents ?? 1) : String(savedFood?.equivalents ?? '');
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, name, portion, equivalents } : food) } : meal) }));
  }

  async function saveCustomFood() {
    if (!foodDraft) return;
    try {
      const { data } = await api.post('/patients/meal-foods', {
        name: foodDraft.name, group: foodDraft.group, portion: foodDraft.portion, equivalents: foodDraft.equivalents,
      });
      setCustomFoods((current) => [...current.filter((food) => !(food.name === data.name && food.group === data.group)), data]);
      setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === foodDraft.mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodDraft.foodIndex ? { ...food, name: data.name, group: data.group, portion: data.portion, equivalents: String(data.equivalents) } : food) } : meal) }));
      setFoodDraft(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo guardar el alimento en tu catálogo.');
    }
  }

  function selectGroup(mealIndex, foodIndex, group) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, group, name: '', equivalents: '' } : food) } : meal) }));
    setActiveFood('');
    setActivePortion('');
  }

  async function save(e) {
    e.preventDefault();
    const incompleteFood = form.meals.some((meal) => meal.foods.some((food) => food.name && (!food.portion.trim() || food.equivalents === '')));
    if (incompleteFood) {
      setError('Completa la porción y los equivalentes de cada alimento seleccionado.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      startDate: form.startDate,
      content: {
        meals: form.meals.map((meal) => ({ ...meal, foods: meal.foods.filter((food) => food.name.trim()) })),
        notes: form.notes,
      },
    };
    try {
      if (editingId) await api.put(`/patients/${patientId}/meal-plans/${editingId}`, payload);
      else await api.post(`/patients/${patientId}/meal-plans`, payload);
      closeEditor();
      await loadPlans();
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo guardar el plan. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(plan) {
    if (!window.confirm(`¿Eliminar “${plan.title}”?`)) return;
    try {
      await api.delete(`/patients/${patientId}/meal-plans/${plan.id}`);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo eliminar el plan.');
    }
  }

  return (
    <section className="meal-plans space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{consultationContext ? 'Plan de alimentación' : 'Planes de alimentación'}</h2>
          <p className="mt-1 text-sm text-gray-500">{consultationContext ? 'Prepara el plan para esta etapa. Se guarda en el expediente del paciente con la fecha de la consulta.' : 'Organiza por tiempos, porciones y equivalentes de grupos SMAE.'}</p>
        </div>
        <button type="button" onClick={startNew} className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">+ Crear plan</button>
      </div>

      {error && !open && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Cargando planes…</p> : plans.length === 0 ? (
        <p className="rounded bg-white p-6 text-center text-sm text-gray-500 shadow">Aún no hay planes para este paciente.</p>
      ) : plans.map((plan) => (
        <article key={plan.id} className="rounded bg-white p-4 shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-semibold">{plan.title}</h3><p className="text-xs text-gray-500">Vigente desde {asDate(plan.startDate)}</p></div>
            <div className="flex gap-3 text-sm"><button type="button" onClick={() => editPlan(plan)} className="text-emerald-700">Editar</button><button type="button" onClick={() => removePlan(plan)} className="text-red-600">Eliminar</button></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(plan.content?.meals ?? []).map((meal, i) => (
              <div key={`${meal.name}-${i}`} className="rounded-xl bg-gray-50 p-3">
                <p className="font-medium">{meal.name}{meal.time ? ` · ${meal.time}` : ''}</p>
                {meal.foods?.length ? <ul className="mt-2 space-y-1 text-sm text-gray-600">{meal.foods.map((food, j) => <li key={`${food.name}-${j}`}>{food.name} — {food.portion} <span className="text-gray-400">({food.equivalents} eq. · {food.group})</span></li>)}</ul> : <p className="mt-2 text-sm text-gray-400">Sin alimentos</p>}
              </div>
            ))}
          </div>
          {equivalentTotals(plan.content?.meals).length > 0 && <p className="mt-3 text-xs text-gray-500"><b>Equivalentes del día:</b> {equivalentTotals(plan.content?.meals).map(([group, amount]) => `${group}: ${amount}`).join(' · ')}</p>}
          {plan.content?.notes && <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{plan.content.notes}</p>}
        </article>
      ))}

      {open && createPortal(<div className="meal-plan-editor-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-3 sm:p-6">
        <form onSubmit={(event) => { event.stopPropagation(); save(event); }} className="meal-plan-editor mx-auto my-4 max-w-4xl space-y-5 rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{editingId ? 'Editar plan' : 'Nuevo plan de alimentación'}</h2><p className="mt-1 text-sm text-gray-500">Agrega alimentos, porción indicada y equivalentes por grupo.</p></div><button type="button" onClick={closeEditor} aria-label="Cerrar" className="text-2xl text-gray-400">×</button></div>
          {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Nombre del plan<input required maxLength="120" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="grid gap-1 text-sm">Fecha de inicio<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label></div>
          <div className="space-y-4">
            {form.meals.map((meal, mi) => <fieldset key={mi} className="space-y-3 rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-wrap items-end gap-3"><label className="grid flex-1 gap-1 text-sm">Tiempo de comida<input required maxLength="80" value={meal.name} onChange={(e) => updateMeal(mi, 'name', e.target.value)} /></label><label className="grid gap-1 text-sm">Hora<input type="time" value={meal.time ?? ''} onChange={(e) => updateMeal(mi, 'time', e.target.value)} /></label><button type="button" onClick={() => setForm({ ...form, meals: form.meals.filter((_, i) => i !== mi) })} className="pb-2 text-sm text-red-600">Quitar tiempo</button></div>
              <div className="space-y-2">{meal.foods.map((food, fi) => {
                const foodKey = `${mi}-${fi}`;
                const suggestions = [...(FOOD_SUGGESTIONS[food.group] ?? []), ...customFoods.filter((item) => item.group === food.group).map((item) => item.name)].filter((name, index, all) => all.indexOf(name) === index);
                return <div key={foodKey} className="meal-food-entry grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-12 sm:items-end">
                <div className="meal-food-search relative grid gap-1 text-sm sm:col-span-3">
                  <label htmlFor={`food-${foodKey}`}>Alimento</label>
                  <button id={`food-${foodKey}`} type="button" className="meal-group-trigger" aria-haspopup="listbox" aria-expanded={activeFood === foodKey} onClick={() => { setActiveGroup(''); setActivePortion(''); setActiveFood((current) => current === foodKey ? '' : foodKey); }}>
                    <span>{food.name || 'Selecciona un alimento'}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span>
                  </button>
                  {activeFood === foodKey && <div className="meal-group-options" role="listbox" aria-label="Alimentos">
                    {suggestions.map((name) => <button key={name} type="button" role="option" aria-selected={food.name === name} onClick={() => { selectFood(mi, fi, name); setActiveFood(''); }}>{name}{customFoods.some((item) => item.name === name && item.group === food.group) ? ' · Mi cuenta' : ''}</button>)}
                    <button type="button" className="meal-create-food-option" onClick={() => { setFoodDraft({ mealIndex: mi, foodIndex: fi, name: '', group: food.group, portion: '', equivalents: '1' }); setActiveFood(''); }}>Crear alimento</button>
                  </div>}
                  {foodDraft?.mealIndex === mi && foodDraft?.foodIndex === fi && <div className="mt-2 space-y-2 rounded-lg border border-emerald-200 bg-white p-3">
                    <label className="grid gap-1">Nuevo alimento<input required maxLength="120" value={foodDraft.name} onChange={(e) => setFoodDraft({ ...foodDraft, name: e.target.value })} /></label>
                    <div className="relative grid gap-1"><span>Porción de referencia</span><button type="button" className="meal-group-trigger" aria-haspopup="listbox" aria-expanded={activePortion === `draft-${foodKey}`} onClick={() => setActivePortion((current) => current === `draft-${foodKey}` ? '' : `draft-${foodKey}`)}><span>{foodDraft.portion || 'Selecciona una porción'}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span></button>{activePortion === `draft-${foodKey}` && <div className="meal-group-options" role="listbox" aria-label="Porciones para alimento nuevo">{PORTION_OPTIONS.map((portion) => <button key={portion} type="button" role="option" aria-selected={foodDraft.portion === portion} onClick={() => { setFoodDraft({ ...foodDraft, portion }); setActivePortion(''); setCustomPortion(''); }}>{portion}</button>)}<button type="button" className="meal-create-food-option" onClick={() => setCustomPortion(`draft-${foodKey}`)}>Otra medida</button>{customPortion === `draft-${foodKey}` && <input autoFocus required maxLength="80" placeholder="Escribe la porción" value={foodDraft.portion} onChange={(e) => setFoodDraft({ ...foodDraft, portion: e.target.value })} />}</div>}</div>
                    <label className="grid gap-1">Equivalentes de esa porción<input required type="number" min="0" max="100" step="0.25" value={foodDraft.equivalents} onChange={(e) => setFoodDraft({ ...foodDraft, equivalents: e.target.value })} /></label>
                    <div className="flex gap-3"><button type="button" disabled={!foodDraft.name.trim() || !foodDraft.portion.trim() || foodDraft.equivalents === ''} className="text-emerald-700 disabled:opacity-50" onClick={saveCustomFood}>Guardar en mi cuenta</button><button type="button" onClick={() => { setFoodDraft(null); setCustomPortion(''); }}>Cancelar</button></div>
                  </div>}
                </div>
                <div className="meal-group-picker relative grid gap-1 text-sm sm:col-span-3">
                  <span id={`group-label-${foodKey}`}>Grupo SMAE</span>
                  <button type="button" className="meal-group-trigger" aria-labelledby={`group-label-${foodKey}`} aria-haspopup="listbox" aria-expanded={activeGroup === foodKey} onClick={() => { setActiveFood(''); setActivePortion(''); setActiveGroup((current) => current === foodKey ? '' : foodKey); }}>
                    <span style={{ color: groupColor(food.group), fontWeight: 700 }}>{displayGroup(food.group)}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span>
                  </button>
                  {activeGroup === foodKey && <div className="meal-group-options" role="listbox" aria-label="Grupos SMAE">{GROUPS.map((group) => <button key={group} type="button" role="option" aria-selected={food.group === group} style={{ color: groupColor(group), fontWeight: 700 }} onClick={() => { selectGroup(mi, fi, group); setActiveGroup(''); }}>{displayGroup(group)}</button>)}</div>}
                </div>
                <div className="meal-portion-field grid gap-1 text-sm sm:col-span-3">
                  <label>Porción</label>
                  <div className="meal-stepper">
                    <button type="button" aria-label={`Reducir ración de ${food.name}`} disabled={!food.portion || Number(food.equivalents) <= 0} onClick={() => adjustEquivalents(mi, fi, -0.25)}>−</button>
                    <output title={food.portion}>{formatPortion(food.portion) || 'Elige un alimento'}</output>
                    <button type="button" aria-label={`Aumentar ración de ${food.name}`} disabled={!food.portion || Number(food.equivalents) >= 100} onClick={() => adjustEquivalents(mi, fi, 0.25)}>+</button>
                  </div>
                </div>
                <label className="meal-equivalents-field grid gap-1 text-sm sm:col-span-2">Equivalentes
                  <div className="meal-stepper">
                    <button type="button" aria-label={`Reducir equivalentes de ${food.name}`} disabled={Number(food.equivalents) <= 0} onClick={() => adjustEquivalents(mi, fi, -0.25)}>−</button>
                    <input required type="number" min="0" max="100" step="0.25" value={food.equivalents} onChange={(e) => updateFood(mi, fi, 'equivalents', e.target.value)} />
                    <button type="button" aria-label={`Aumentar equivalentes de ${food.name}`} disabled={Number(food.equivalents) >= 100} onClick={() => adjustEquivalents(mi, fi, 0.25)}>+</button>
                  </div>
                </label>
                <button type="button" aria-label="Quitar alimento" onClick={() => updateMeal(mi, 'foods', meal.foods.filter((_, i) => i !== fi))} className="meal-food-remove pb-2 text-sm text-red-600 sm:col-span-1">Quitar</button>
              </div>; })}</div>
              <button type="button" onClick={() => updateMeal(mi, 'foods', [...meal.foods, emptyFood()])} className="text-sm font-medium text-emerald-700">+ Agregar alimento</button>
            </fieldset>)}
          </div>
          <button type="button" disabled={form.meals.length >= 12} onClick={() => setForm({ ...form, meals: [...form.meals, emptyMeal()] })} className="text-sm font-medium text-emerald-700">+ Agregar tiempo de comida</button>
          {equivalentTotals(form.meals).length > 0 && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><b>Equivalentes del día:</b><p className="mt-1">{equivalentTotals(form.meals).map(([group, amount]) => `${group}: ${amount}`).join(' · ')}</p></div>}
          <label className="grid gap-1 text-sm">Indicaciones o notas<textarea rows="3" maxLength="3000" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <p className="text-xs text-gray-500">Los grupos siguen la organización SMAE. Verifica porciones y equivalentes con la edición o fuente profesional que utilizas.</p>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" onClick={closeEditor} className="rounded border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">{saving ? 'Guardando…' : 'Guardar plan'}</button></div>
        </form>
      </div>, document.body)}
    </section>
  );
}
