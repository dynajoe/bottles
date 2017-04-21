port module App exposing (..)

import Json.Decode
import Debug

-- MODEL


type alias Position =
    { x : Float
    , y : Float
    }


type alias RadarEntry =
    { name : String
    , distance : Float
    , heading : Float
    }


type alias Model =
    String


type alias BrainTick =
    { heading : Float
    , speed : Float
    , radar_heading : Float
    }


type alias Sensors =
    { heading : Float
    , turretHeading : Float
    , radarHeading : Float
    , position : Position
    , speed : Float
    , firePower : Float
    , radar : List RadarEntry
    , ticks : Int
    }


initialModel : Sensors
initialModel =
    { heading = 0.0
    , turretHeading = 0.0
    , radarHeading = 0.0
    , position = { x = 0.0, y = 0.0 }
    , speed = 0.0
    , firePower = 0.0
    , radar = []
    , ticks = 0
    }


init : ( Model, Cmd Msg )
init =
    ( "Foo", Cmd.none )



-- MESSAGES


type Msg
    = Tick Sensors



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case Debug.log "Message: " msg of
        Tick sensors ->
            let t = { heading = 2.0, speed = 1.0, radar_heading = sensors.radarHeading + 1 }
            in ( "Name here", brainTick t )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ brainUpdate Tick ]


port brainUpdate : (Sensors -> msg) -> Sub msg


port brainTick : BrainTick -> Cmd msg



-- MAIN


main : Program Never Model Msg
main =
    Platform.program
        { init = init
        , update = update
        , subscriptions = subscriptions
        }
