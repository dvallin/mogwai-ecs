import { World } from "../src/World";
import { VectorStorage } from "../src/Storage";
import { VertexTraverser } from "../src/Traverser";

enum CocktailType {
    BeforeDinner,
    AfterDinner,
    Longdrink,
    Sparkling,
    AllDay
}

enum Iba {
    Unforgettable,
    Contemporary,
    NewEra,
    None
}

enum Unit {
    Cl,
    Dash,   // like a bottle cup
    Splash, // more than a dash but completly unspecified
    BarSpoon, // roughly 5 ml or 1/2 cl or 1 tsp ;)
    Drop,
    Pinch,
    None    // countable things
}

const W = new World()
const cocktails: { [name: string]: number } = {}
const ingredients: { [name: string]: number } = {}


function addIngredient(name: string) {
    ingredients[name] = W.entity()
        .with("ingredient")
        .with("name", { name })
        .close()
}

function connectIngredient(cocktail: string, ingredient: string, amount: number, unit: Unit) {
    W.relation()
        .from(cocktails[cocktail])
        .to(ingredients[ingredient])
        .with("contains")
        .with("amount", { amount, unit })
        .close()
}

function addCocktail(name: string, type: CocktailType = CocktailType.AllDay, iba: Iba = Iba.None,
    ...recipe: Array<Array<any>>) {
    cocktails[name] = W.entity()
        .with("cocktail")
        .with("name", { name })
        .with("iba", { iba })
        .with("cocktailType", { type })
        .close()
    for (const r of recipe) {
        if (ingredients[r[0]] === undefined) {
            addIngredient(r[0])
        }
        connectIngredient(name, r[0], r[1], r[2])
    }
}

function cocktailsOfType(t: VertexTraverser, type: CocktailType): VertexTraverser {
    return t.matchesValue<{ type: CocktailType }>("cocktailType", t => t.type === type)
}

describe("Iba cocktails", () => {
    beforeAll(() => {
        W.registerComponent("cocktail");
        W.registerComponent("ingredient");
        W.registerComponent("iba", new VectorStorage<{ iba: Iba }>());
        W.registerComponent("name", new VectorStorage<{ name: string }>());
        W.registerComponent("cocktailType", new VectorStorage<{ type: CocktailType }>());

        W.registerRelation("contains");
        W.registerRelation("amount", new VectorStorage<{ amount: number, unit: Unit }>());

        addCocktail("Alexander", CocktailType.AfterDinner, Iba.Unforgettable,
            ["Cognac", 3, Unit.Cl],
            ["Crème de Cacao (brown)", 3, Unit.Cl],
            ["Fresh cream", 3, Unit.Cl]
        )

        addCocktail("Americano", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Campari", 3, Unit.Cl],
            ["Sweet Vermouth", 3, Unit.Cl],
            ["Soda Water", 1, Unit.Splash]
        )

        addCocktail("Angel Face", CocktailType.AllDay, Iba.Unforgettable,
            ["Calvados", 3, Unit.Cl],
            ["Gin", 3, Unit.Cl],
            ["Apricot Brandy", 3, Unit.Cl]
        )

        addCocktail("Aviation", CocktailType.AllDay, Iba.Unforgettable,
            ["Gin", 4.5, Unit.Cl],
            ["Maraschino", 1.5, Unit.Cl],
            ["Lemon juice", 1.5, Unit.Cl]
        )

        addCocktail("Bacardi", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Bacardi Carta Blanca", 4.5, Unit.Cl],
            ["Lime juice", 2, Unit.Cl],
            ["Grenadine", 1, Unit.Cl]
        )

        addCocktail("Between the sheets", CocktailType.AllDay, Iba.Unforgettable,
            ["Cognac", 3, Unit.Cl],
            ["White rum", 3, Unit.Cl],
            ["Triple Sec", 3, Unit.Cl],
            ["Lemon juice", 2, Unit.Cl]
        )

        addCocktail("Casino", CocktailType.AllDay, Iba.Unforgettable,
            ["Old Tom Gin", 4, Unit.Cl],
            ["Maraschino", 1, Unit.Cl],
            ["Orange bitters", 1, Unit.Cl],
            ["Lemon juice", 1, Unit.Cl]
        )

        addCocktail("Clover Club", CocktailType.AllDay, Iba.Unforgettable,
            ["Gin", 4.5, Unit.Cl],
            ["Raspberry syrup", 1.5, Unit.Cl],
            ["Egg white", 1, Unit.Dash]
        )

        addCocktail("Daiquiri", CocktailType.AllDay, Iba.Unforgettable,
            ["White rum", 6, Unit.Cl],
            ["Simple syrup", 1.5, Unit.Cl],
            ["Lime juice", 2.5, Unit.Cl]
        )

        addCocktail("Derby", CocktailType.AllDay, Iba.Unforgettable,
            ["Gin", 6, Unit.Cl],
            ["Peach bitters", 2, Unit.Drop],
            ["Mint leaf", 2, Unit.None]
        )

        addCocktail("Dry Martini", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Gin", 6, Unit.Cl],
            ["Dry Vermouth", 1, Unit.Cl]
        )

        addCocktail("Gin Fizz", CocktailType.Longdrink, Iba.Unforgettable,
            ["Gin", 4.5, Unit.Cl],
            ["Sugar syrup", 1, Unit.Cl],
            ["Lemon juice", 3, Unit.Cl],
            ["Soda water", Unit.Cl]
        )

        addCocktail("John Collins", CocktailType.Longdrink, Iba.Unforgettable,
            ["Gin", 4.5, Unit.Cl],
            ["Sugar syrup", 1.5, Unit.Cl],
            ["Lemon juice", 3, Unit.Cl],
            ["Soda water", Unit.Cl]
        )

        addCocktail("Manhattan", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Rye whiskey", 5, Unit.Cl],
            ["Sweet Vermouth", 2, Unit.Cl],
            ["Angostura Bitter", 1, Unit.Dash]
        )

        addCocktail("Mary Pickford", CocktailType.AllDay, Iba.Unforgettable,
            ["White rum", 6, Unit.Cl],
            ["Maraschino", 1, Unit.Cl],
            ["Grenadine", 1, Unit.Cl],
            ["Pineapple juice", 6, Unit.Cl]
        )

        addCocktail("Monkey Gland", CocktailType.AllDay, Iba.Unforgettable,
            ["Gin", 5, Unit.Cl],
            ["Orange juice", 3, Unit.Cl],
            ["Absinth", 2, Unit.Drop],
            ["Grenadine", 2, Unit.Drop])

        addCocktail("Negroni", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Campari", 3, Unit.Cl],
            ["Sweet Vermouth", 3, Unit.Cl],
            ["Soda Water", 1, Unit.Splash]
        )

        addCocktail("Old Fashioned", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Bourbon", 4.5, Unit.Cl],
            ["Angostura Bitter", 2, Unit.Dash],
            ["Sugar cube", 1, Unit.None],
            ["Water", 1, Unit.Dash]
        )

        addCocktail("Paradise", CocktailType.AllDay, Iba.Unforgettable,
            ["Gin", 3.5, Unit.Cl],
            ["Apricot Brandy", 2, Unit.Cl],
            ["Orange juice", 1.5, Unit.Cl]
        )

        addCocktail("Planter's Punch", CocktailType.Longdrink, Iba.Unforgettable,
            ["Dark rum", 4.5, Unit.Cl],
            ["Orange juice", 3.5, Unit.Cl],
            ["Pineapple juice", 3.5, Unit.Cl],
            ["Lemon juice", 2, Unit.Cl],
            ["Grenadine", 1, Unit.Cl],
            ["Sugar syrup", 1, Unit.Cl],
            ["Angostura Bitter", 4, Unit.Dash]
        )

        addCocktail("Porto Flip", CocktailType.AfterDinner, Iba.Unforgettable,
            ["Brandy", 1.5, Unit.Cl],
            ["Red port", 4.5, Unit.Cl],
            ["Egg yolk", 1, Unit.Cl],
            ["Nutmeg", 1, Unit.Pinch]
        )

        addCocktail("Ramos Gin Fizz", CocktailType.Longdrink, Iba.Unforgettable,
            ["Gin", 4.5, Unit.Cl],
            ["Sugar syrup", 3, Unit.Cl],
            ["Lime juice", 1.5, Unit.Cl],
            ["Lemon juice", 1.5, Unit.Cl],
            ["Cream", 6, Unit.Cl],
            ["Egg white", 1, Unit.None],
            ["Orange flower water", 3, Unit.Dash],
            ["Vanilla extract", 2, Unit.Drop],
            ["Soda water", 1, Unit.Splash]
        )

        addCocktail("Rusty Nail", CocktailType.AfterDinner, Iba.Unforgettable,
            ["Scotch whisky", 4.5, Unit.Cl],
            ["Drambuie", 2.5, Unit.Cl]
        )

        addCocktail("Sazerac", CocktailType.AfterDinner, Iba.Unforgettable,
            ["Cognac", 5, Unit.Cl],
            ["Absinthe", 1, Unit.Cl],
            ["Sugar cube", 1, Unit.None],
            ["Peychaud’s bitters", 2, Unit.Dash]
        )

        addCocktail("Screwdriver", CocktailType.AllDay, Iba.Unforgettable,
            ["Vodka", 5, Unit.Cl],
            ["Orange juice", 10, Unit.Cl]
        )

        addCocktail("Sidecar", CocktailType.AllDay, Iba.Unforgettable,
            ["Cognac", 5, Unit.Cl],
            ["Triple Sec", 2, Unit.Cl],
            ["Lemon juice", 2, Unit.Cl]
        )

        addCocktail("Stinger", CocktailType.AfterDinner, Iba.Unforgettable,
            ["Cognac", 5, Unit.Cl],
            ["Crème de Menthe (white)", 2, Unit.Cl]
        )

        addCocktail("Tuxedo", CocktailType.AllDay, Iba.Unforgettable,
            ["Old Tom Gin", 3, Unit.Cl],
            ["Dry vermouth", 3, Unit.Cl],
            ["Maraschino", 0.5, Unit.BarSpoon],
            ["Absinthe", 0.25, Unit.BarSpoon],
            ["Orange bitters", 3, Unit.Dash]
        )

        addCocktail("Whiskey Sour", CocktailType.BeforeDinner, Iba.Unforgettable,
            ["Bourbon", 4.5, Unit.Cl],
            ["Sugar syrup", 1.5, Unit.Cl],
            ["Lemon juice", 3, Unit.Cl],
            ["Egg white", 1, Unit.Dash]
        )

        addCocktail("White Lady", CocktailType.AllDay, Iba.Unforgettable,
            ["Gin", 4, Unit.Cl],
            ["Triple sec", 3, Unit.Cl],
            ["Lemon juice", 2, Unit.Cl]
        )

        addCocktail("Bellini", CocktailType.Sparkling, Iba.Contemporary,
            ["Prosecco", 10, Unit.Cl],
            ["Peach purree", 5, Unit.Cl]
        )

        addCocktail("Puccini", CocktailType.Sparkling, Iba.Contemporary,
            ["Prosecco", 10, Unit.Cl],
            ["Peach purree", 5, Unit.Cl]
        )

        addCocktail("Rossini", CocktailType.Sparkling, Iba.Contemporary,
            ["Prosecco", 10, Unit.Cl],
            ["Peach purree", 5, Unit.Cl]
        )

        addCocktail("Tintoretto", CocktailType.Sparkling, Iba.Contemporary,
            ["Prosecco", 10, Unit.Cl],
            ["Peach purree", 5, Unit.Cl]
        )

        addCocktail("Black Russian", CocktailType.AfterDinner, Iba.Contemporary,
            ["Vodka", 5, Unit.Cl],
            ["Coffee liqueur", 2, Unit.Cl]
        )

        addCocktail("White Russian", CocktailType.AfterDinner, Iba.Contemporary,
            ["Vodka", 5, Unit.Cl],
            ["Coffee liqueur", 2, Unit.Cl],
            ["Cream", 1, Unit.Splash]
        )

        addCocktail("Bloody Mary", CocktailType.AllDay, Iba.Contemporary,
            ["Vodka", 4.5, Unit.Cl],
            ["Tomato juice", 9, Unit.Cl],
            ["Lemon juice", 1.5, Unit.Cl],
            ["Worcestershire Sauce", 3, Unit.Dash],
            ["Tabasco", 1, Unit.Dash],
            ["Celery salt", 1, Unit.Pinch],
            ["Pepper", 1, Unit.Pinch]
        )

        addCocktail("Caipirinha")
        addCocktail("Champagne Cocktail")
        addCocktail("Cosmopolitan")
        addCocktail("Cuba Libre")

        addCocktail("French 75", CocktailType.Sparkling, Iba.Contemporary,
            ["Gin", 3, Unit.Cl],
            ["Lemon juice", 1.5, Unit.Cl],
            ["Sugar syrup", 2, Unit.Dash],
            ["Champagne", 6, Unit.Cl]
        )

        addCocktail("French Connection")
        addCocktail("God Father")
        addCocktail("God Mother")
        addCocktail("Golden Dream")
        addCocktail("Grasshopper")
        addCocktail("Harvey Wallbanger")
        addCocktail("Hemingway Special")
        addCocktail("Horse's Neck")
        addCocktail("Irish Coffee")
        addCocktail("Kir")
        addCocktail("Long Island Ice Tea")
        addCocktail("Mai-Tai")
        addCocktail("Margarita")
        addCocktail("Mimosa")
        addCocktail("Mint Julep")
        addCocktail("Mojito")
        addCocktail("Moscow Mule")
        addCocktail("Pina Colada")

        addCocktail("Rose", CocktailType.AfterDinner, Iba.Contemporary,
            ["Kirsch", 2, Unit.Cl],
            ["Dry Vermouth", 4, Unit.Cl],
            ["Strawberry syrup", 3, Unit.Dash]
        )

        addCocktail("Sea Breeze")
        addCocktail("Sex On The Beach")
        addCocktail("Singapore Sling")
        addCocktail("Tequila Sunrise")

        addCocktail("B52", CocktailType.AfterDinner, Iba.NewEra,
            ["Triple sec", 2, Unit.Cl],
            ["Irish cream", 2, Unit.Cl],
            ["Coffee liqueur", 2, Unit.Cl]
        )

        addCocktail("Barracuda")
        addCocktail("Bramble")

        addCocktail("Dark'n'Stormy", CocktailType.Longdrink, Iba.NewEra,
            ["Dark rum", 6, Unit.Cl],
            ["Ginger beer", 10, Unit.Cl]
        )

        addCocktail("Dirty Martini", CocktailType.AfterDinner, Iba.NewEra,
            ["Vodka", 6, Unit.Cl],
            ["Dry Vermouth", 1, Unit.Cl],
            ["Olive juice", 1, Unit.Cl]
        )

        addCocktail("Espresso Martini")
        addCocktail("French Martini")
        addCocktail("Kamikaze")
        addCocktail("Lemon Drop Martini")

        addCocktail("Pisco Sour", CocktailType.AllDay, Iba.NewEra,
            ["Pisco", 4.5, Unit.Cl],
            ["Sugar syrup", 2, Unit.Cl],
            ["Lemon juice", 3, Unit.Cl],
            ["Egg white", 1, Unit.None]
        )

        addCocktail("Russion Spring Punch")
        addCocktail("Spritz Veneziano")
        addCocktail("Tommy's Margarita")
        addCocktail("Vampiro")

        addCocktail("Vesper", CocktailType.BeforeDinner, Iba.NewEra,
            ["Gin", 6, Unit.Cl],
            ["Vodka", 1.5, Unit.Cl],
            ["Lillet Blonde", 0.75, Unit.Cl],
            ["Lemon twist", 1, Unit.None]
        )

        addCocktail("Yellow Bird", CocktailType.AllDay, Iba.NewEra,
            ["White rum", 3, Unit.Cl],
            ["Galliano", 1.5, Unit.Cl],
            ["Triple sec", 1.5, Unit.Cl],
            ["Lime juice", 1.5, Unit.Cl]
        )

        addCocktail("Boulevardier", CocktailType.BeforeDinner, Iba.None,
            ["Rye whiskey", 3, Unit.Cl],
            ["Sweet Vermouth", 3, Unit.Cl],
            ["Campari", 3, Unit.Cl]
        )

        addCocktail("Blood And Sand", CocktailType.BeforeDinner, Iba.None,
            ["Scotch whisky", 2, Unit.Cl],
            ["Cherry brandy", 2, Unit.Cl],
            ["Sweet Vermouth", 2, Unit.Cl],
            ["Orange juice", 2, Unit.Cl]
        )

        addCocktail("Bee's Knees", CocktailType.AllDay, Iba.None,
            ["Gin", 6, Unit.Cl],
            ["Honey", 2, Unit.Cl],
            ["Lemon juice", 2, Unit.Cl]
        )

        addCocktail("Bronx", CocktailType.BeforeDinner, Iba.None,
            ["Gin", 6, Unit.Cl],
            ["Sweet Vermouth", 1.5, Unit.Cl],
            ["Dry vermouth", 1.5, Unit.Cl],
            ["Orange juice", 1.5, Unit.Cl]
        )
    })

    it("knows the unforgettables", () => {
        const afterDinnerCocktails = W.fetch()
            .on((t) => t.matchesValue<{ iba: Iba }>("iba", i => i.iba === Iba.Unforgettable))
            .withComponents("name")
            .stream()
            .map(cocktail => cocktail.name.name)
            .toArray()
        expect(afterDinnerCocktails).toEqual(
            ["Alexander", "Americano", "Angel Face", "Aviation", "Bacardi", "Between the sheets", "Casino", "Clover Club", "Daiquiri", "Derby", "Dry Martini", "Gin Fizz", "John Collins", "Manhattan", "Mary Pickford", "Monkey Gland", "Negroni", "Old Fashioned", "Paradise", "Planter's Punch", "Porto Flip", "Ramos Gin Fizz", "Rusty Nail", "Sazerac", "Screwdriver", "Sidecar", "Stinger", "Tuxedo", "Whiskey Sour", "White Lady"]
        )
    })

    it("knows after dinner cocktails", () => {
        const afterDinnerCocktails = W.fetch()
            .on((t) => cocktailsOfType(t, CocktailType.AfterDinner))
            .withComponents("name")
            .stream()
            .map(cocktail => cocktail.name.name)
            .toArray()
        expect(afterDinnerCocktails).toEqual(
            ["Alexander", "Porto Flip", "Rusty Nail", "Sazerac", "Stinger", "Black Russian", "White Russian", "Rose", "B52", "Dirty Martini"]
        )
    })

    it("knows cocktails with Sweet vermouth", () => {
        const cognacCocktails = W.fetch(ingredients["Sweet Vermouth"])
            .on(t => t.in("contains"))
            .withComponents("name")
            .stream()
            .map(cocktail => cocktail.name.name)
            .sort()
            .toArray()
        expect(cognacCocktails).toEqual(["Americano", "Blood And Sand", "Boulevardier", "Bronx", "Manhattan", "Negroni"])
    })

    it("finds ingredients by popularity", () => {
        const popularIngredients = W.fetch()
            .on(t => t.hasLabel("ingredient")
                .matchesDegree((inDegree, { }) => inDegree > 5))
            .withComponents("name", "in")
            .stream()
            .sort((d) => d.in.size)
            .map(cocktail => cocktail.name.name)
            .toArray()
        expect(popularIngredients).toEqual(
            ["Vodka", "Orange juice", "Sugar syrup", "Lemon juice", "Gin", "Sweet Vermouth"]
        )

        const leastPopularIngredients = W.fetch()
            .on(t => t.hasLabel("ingredient")
                .matchesDegree((inDegree, { }) => inDegree < 2))
            .withComponents("name", "in")
            .stream()
            .map(cocktail => cocktail.name.name)
            .sort()
            .first(3)
            .toArray()
        expect(leastPopularIngredients).toEqual(["Absinth", "Bacardi Carta Blanca", "Brandy"])

    })

    it("knows cognac based cocktails", () => {
        const cognacCocktails = W.fetch(ingredients["Cognac"])
            .on(t => t.in("contains"))
            .withComponents("name")
            .stream()
            .map(cocktail => cocktail.name.name)
            .toArray()
        expect(cognacCocktails).toEqual(["Alexander", "Between the sheets", "Sazerac", "Sidecar", "Stinger"])

        const additionalIngredientsForCognacCoctails = W.fetch(ingredients["Cognac"])
            .on(t => t
                .let("notA", t => t.not())
                .let("B", t => t.in("contains").out("contains"))
                .and("notA", "B")
            )
            .withComponents("name")
            .stream()
            .map(ingredient => ingredient.name.name)
            .sort()
            .toArray()
        expect(additionalIngredientsForCognacCoctails).toEqual([
            "Absinthe",
            "Crème de Cacao (brown)",
            "Crème de Menthe (white)",
            "Fresh cream",
            "Lemon juice",
            "Peychaud’s bitters",
            "Sugar cube",
            "Triple Sec",
            "White rum"
        ])
    })
})