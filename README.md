# elm-datetime-picker

Single and duration datetime picker components written in Elm 0.19

## Install

`elm install mercurymedia/elm-datetime-picker`

## In action

#### Single Picker

![single-datepicker](https://github.com/user-attachments/assets/0bd666e8-7805-48c9-b188-a27a6205742c)

#### Duration Picker

![duration-datepicker](https://github.com/user-attachments/assets/e6d570c7-3bab-4f6c-a235-69fdd5195218)

## Usage

This package exposes two core modules, `SingleDatePicker` and `DurationDatePicker`, and a third one for configuration `DatePicker.Settings`. As their names imply, `SingleDatePicker` can be used to pick a singular datetime while `DurationDatePicker` is used to select a datetime range. To keep things simple, the documentation here focuses on the `SingleDatePicker` but both types have an example app for additional reference.

There are four steps to configure the `DatePicker`:

1. Add the picker to the model and initialize it in the model init. One message needs to be defined that expects an internal `DatePicker` message. This is used to update the selection and view of the picker.

```elm
import DatePicker.Settings exposing (Settings, defaultSettings)
import SingleDatePicker as DatePicker

type alias Model =
    { ...
    , picker : DatePicker.DatePicker Msg
    }

type Msg
    = ...
    | UpdatePicker DatePicker.Msg

init : ( Model, Cmd Msg )
init =
    ( { ...
      , picker = DatePicker.init UpdatePicker
      }
    , Cmd.none
    )
```

2. We call the `DatePicker.view` function, passing it the picker `Settings` and the `DatePicker` instance to be operated on. The minimal picker `Settings` only require a `Time.Zone`

```elm
userDefinedDatePickerSettings : Zone -> Settings
userDefinedDatePickerSettings timeZone =
    defaultSettings timeZone

view : Model -> Html Msg
view model =
    ...
    div []
        [ button [ onClick OpenPicker ] [ text "Open Me!" ]
        , DatePicker.view userDefinedDatePickerSettings model.picker
        ]
```

While we are on the topic of the `DatePicker.view`, it is worth noting that this date picker does _not_ include an input or button to trigger the view to open, this is up to the user to define and allows the picker to be flexible across different use cases.

3. Now it is time for the meat and potatoes: handling the `DatePicker` updates, including `saving` the time selected in the picker to the calling module's model.

```elm
type alias Model =
    { ...
    , today : Posix
    , zone : Zone
    , pickedTime : Maybe Posix
    , picker : DatePicker.DatePicker
    }

type Msg
    = ...
    | OpenPicker
    | UpdatePicker DatePicker.Msg

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ...

        OpenPicker ->
            ( { model | picker = DatePicker.openPicker model.zone model.today model.pickedTime model.picker }, Cmd.none )

        UpdatePicker subMsg ->
            let
                ( newPicker, maybeNewTime ) =
                    SingleDatePicker.update (userDefinedDatePickerSettings model.zone model.currentTime) subMsg model.picker
            in
            ( { model | picker = newPicker, pickedTime = Maybe.map (\t -> Just t) maybeNewTime |> Maybe.withDefault model.pickedTime }, Cmd.none )
```

The user is responsible for defining his or her own `Open` picker message and placing the relevant event listener where he or she pleases. When handling this message in the `update` as seen above, we call `DatePicker.openPicker` which simply returns an updated picker instance to be stored on the model (`DatePicker.closePicker` is also provided and returns an updated picker instance like `openPicker` does). `DatePicker.openPicker` takes a `Zone` (the time zone in which to display the picker), `Posix` (the base time), a `Maybe Posix` (the picked time), and the `DatePicker` instance we wish to open. The base time is used to inform the picker what day it should center on in the event no datetime has been selected yet. This could be the current date or another date of the implementer's choosing.

Remember that message we passed into the `DatePicker` settings? Here is where it comes into play. `UpdatePicker` let's us know that an update of the `DatePicker` instance's internal state needs to happen. To process the `DatePicker.Msg` you can pass it to the respective `DatePicker.update` function along with the `Settings` and the current `DatePicker` instance. That will then return us the updated `DatePicker` instance, to save in the model of the calling module. Additionally, we get a `Maybe Posix`. In the case of `Just` a time, we set that on the model as the new `pickedTime` otherwise we default to the current `pickedTime`.

## Automatically close the picker

In the event you want the picker to close automatically when clicking outside of it, the module uses a subscription to determine when to close (outside of a save). Wire the picker subscription like below.

```elm
subscriptions : Model -> Sub Msg
subscriptions model =
    SingleDatePicker.subscriptions model.picker
```

## Open the picker outside the DOM hierarchy

By default, the picker is positioned relative to the nearest positioned ancestor by utilizing the CSS rule `position: absolute` so you need to place the `Datepicker.view` as a child of the trigger element within the DOM hierarchy. But sometimes, when rendering the picker somewhere deeply nested in the DOM hierarchy, the popup might interfere with its container elements' CSS rules – resulting in z-index or overflow problems. 

*A typical example would be to have the trigger element that opens the picker (e.g. a button) nested into a scroll container with a limited width and hiding its horizontal overflow. When rendering the picker as part of that same container sticking to the trigger element, it might exceed the container's width and gets cut off by the overflow rule. Have a look at the `BasicModal` example to learn more.*

Since the `Datepicker.view` is independant from any trigger element you can render it anywhere you want in the DOM already – you just need to manually deal with the picker's position if you still want it to be attached to the trigger element.

Instead of using the default `Datepicker.openPicker` function, you can use the `Datepicker.openPickerOutsideDomHierarchy` and `Datepicker.updatePickerPosition` functions to handle the positioning. You simply need to make sure to pass your trigger element's id and handle updates in case of any events that might change the trigger element's position (e.g. onScroll, onResize, etc.). The trigger's and picker's positions are being calculated based on the viewport. By default it will align to the bottom right of the trigger element (as usual) but it will automatically adjust to the trigger element's top/bottom/left/right based on available space to each side.

Here's an example (also have a look at the `BasicModal` example):

```elm
type Msg
    = ...
    | OpenPicker
    | UpdatePicker DatePicker.Msg
    | OnViewPortChange

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ...

        OpenPicker ->
            let
                ( newPicker, cmd ) =
                    DatePicker.openPickerOutsideHierarchy 
                        "my-button" 
                        (userDefinedDatePickerSettings model.zone model.currentTime) 
                        model.currentTime 
                        model.pickedTime 
                        model.picker
            in
            ( { model | picker = newPicker }, cmd )

        UpdatePicker subMsg ->
            ...

        OnViewportChange ->
            ( model, DatePicker.updatePickerPosition model.picker )



        
subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ ...
        , Browser.Events.onResize (\_ _ -> OnViewportChange)
        ]
        
```

## Presets

Date or date range presets can be added with the settings configuration. The list of presets is empty by default.

```elm
type alias Settings =
    { -- [...]
    , presets : List Preset
    }
```

To configure presets, just add data of the following required type to the list:

```elm

type Preset
    = PresetDate PresetDateConfig -- for single date pickers
    | PresetRange PresetRangeConfig -- for duration date pickers

type alias PresetDateConfig =
    { title : String
    , date : Posix
    }

type alias PresetRangeConfig =
    { title : String
    , range : { start : Posix, end : Posix }
    }
```

Here's an example:

```elm
userDefinedDatePickerSettings : Zone -> Posix -> Settings
userDefinedDatePickerSettings zone today =
    let
        defaults =
            defaultSettings zone
    in
    { defaults
        | presetRanges =
            [ { title = "This month"
              , range =
                    { start = TimeExtra.floor Month zone today
                    , end =
                        TimeExtra.floor Month zone today
                            |> TimeExtra.add Month 1 zone
                            |> TimeExtra.add Day -1 zone
                    }
              }
            ]
    }
```

## Additional Configuration

This is the settings type to be used when configuring the `datepicker`. More configuration will be available in future releases.

```elm
type alias Settings =
    { zone : Zone
    , id : String
    , formattedDay : Weekday -> String
    , formattedMonth : Month -> String
    , isDayDisabled : Zone -> Posix -> Bool
    , focusedDate : Maybe Posix
    , dateStringFn : Zone -> Posix -> String
    , timePickerVisibility : TimePickerVisibility
    , showCalendarWeekNumbers : Bool
    , presets : List Preset
    , theme : Theme
    }
```

## Examples

Examples can be found in the [examples](https://github.com/mercurymedia/elm-datetime-picker/tree/master/examples) folder. To view the examples in the browser run `npm install` and `npm start` from the root of the repository.

## CSS & Theming

The CSS for the date picker is now defined in a built-in way using [elm-css](https://package.elm-lang.org/packages/rtfeldman/elm-css/latest/).
There are some design tokens that can be configured individually in a theme.
In case you need to add additional styling, you can use the CSS-classes that are attached to all the components. You'll find a list of all classes under `/css/DateTimePicker.css`.

In case you'd like to use the Theme, you can pass your custom theme to the `Settings`. sThe `Theme` record currently looks like this:

```elm
type alias Theme =
    { fontSize :
        { base : Css.Px
        , sm : Css.Px
        , xs : Css.Px
        , xxs : Css.Px
        }
    , color :
        { text :
            { primary : Css.Color
            , secondary : Css.Color
            , disabled : Css.Color
            }
        , primary :
            { main : Css.Color
            , contrastText : Css.Color
            , light : Css.Color
            }
        , background :
            { container : Css.Color
            , footer : Css.Color
            , presets : Css.Color
            }
        , action : { hover : Css.Color }
        , border : Css.Color
        }
    , size :
        { presetsContainer : Css.Px
        , day : Css.Px
        , iconButton : Css.Px
        }
    , borderWidth : Css.Px
    , borderRadius :
        { base : Css.Px
        , lg : Css.Px
        }
    , boxShadow :
        { offsetX : Css.Px
        , offsetY : Css.Px
        , blurRadius : Css.Px
        , spreadRadius : Css.Px
        , color : Css.Color
        }
    , zIndex : Int
    , transition : { duration : Float }
    }
```

Passing a customized theme to the settings works like this:

```elm
import Css -- from elm-css
import DatePicker.Settings
    exposing
        ( Settings
        , Theme
        , defaultSettings
        , defaultTheme
        )

-- [...]

customTheme : Theme
customTheme =
    { defaultTheme
        | color =
            { text =
                { primary = Css.hex "22292f"
                , secondary = Css.rgba 0 0 0 0.5
                , disabled = Css.rgba 0 0 0 0.25
                }
            , primary =
                { main = Css.hex "3490dc"
                , contrastText = Css.hex "ffffff"
                , light = Css.rgba 52 144 220 0.1
                }
            , background =
                { container = Css.hex "ffffff"
                , footer = Css.hex "ffffff"
                , presets = Css.hex "ffffff"
                }
            , action = { hover = Css.rgba 0 0 0 0.08 }
            , border = Css.rgba 0 0 0 0.1
            }
    }


userDefinedDatePickerSettings : Zone -> Posix -> Settings
userDefinedDatePickerSettings zone today =
    let
        defaults =
            defaultSettings zone
    in
    { defaults
        | -- [...]
        , theme = customTheme
    }

```
