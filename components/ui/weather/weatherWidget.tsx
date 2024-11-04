import React, { useState } from 'react'
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Wind, Sunrise, Sunset, CloudFog, CloudHail, CloudDrizzle, CloudSun } from 'lucide-react'

export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'thunderstorm' | 'foggy' | 'hail' | 'showers' | 'partly cloudy'

export interface WeatherData {
    title: string;
    location: string;
    currentTime: string;
    temperatureUnit: 'C' | 'F';
    windSpeedUnit: 'km/h' | 'mph';
    current: {
        temperature: number;
        condition: WeatherCondition;
        humidity: number;
        windSpeed: number;
        sunrise: string;
        sunset: string;
        precipitation: number;
    };
    forecast?: {
        day: string;
        highTemp: number;
        lowTemp: number;
        condition: WeatherCondition;
        precipitation: number;
    }[];
}

interface WeatherIconProps {
    condition: WeatherCondition;
    className?: string;
    isNight?: boolean;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, className = 'w-6 h-6', isNight = false }) => {
    const getIconColor = (): string => {
        if (condition.includes('showers')) return 'text-blue-400'

        switch (condition) {
            case 'clear': return isNight ? 'text-gray-300' : 'text-yellow-400'
            case 'cloudy': return 'text-gray-500'
            case 'partly cloudy': return 'text-yellow-100'
            case 'rainy': return 'text-blue-400'
            case 'snowy': return 'text-blue-200'
            case 'thunderstorm': return 'text-yellow-300'
            case 'foggy': return 'text-gray-500'
            case 'hail': return 'text-blue-300'
            default: return 'text-yellow-400'
        }
    }

    const iconColor = getIconColor()

    if (condition.includes('showers')) {
        return <CloudRain className={`${className} ${iconColor}`} />
    }

    switch (condition) {
        case 'clear':
            return isNight ? <Moon className={`${className} ${iconColor}`} /> : <Sun className={`${className} ${iconColor}`} />
        case 'cloudy':
            return <Cloud className={`${className} ${iconColor}`} />
        case 'partly cloudy':
            return <CloudSun className={`${className} ${iconColor}`} />
        case 'rainy':
            return <CloudDrizzle className={`${className} ${iconColor}`} />
        case 'snowy':
            return <CloudSnow className={`${className} ${iconColor}`} />
        case 'thunderstorm':
            return <CloudLightning className={`${className} ${iconColor}`} />
        case 'foggy':
            return <CloudFog className={`${className} ${iconColor}`} />
        case 'hail':
            return <CloudHail className={`${className} ${iconColor}`} />
        default:
            return <Sun className={`${className} ${iconColor}`} />
    }
}

interface TemperatureToggleProps {
    isCelsius: boolean;
    onToggle: () => void;
}

const TemperatureToggle: React.FC<TemperatureToggleProps> = ({ isCelsius, onToggle }) => (
    <div className="flex items-center space-x-2">
        <span className={`text-sm font-medium ${!isCelsius ? 'text-white' : 'text-gray-300'}`}>°F</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only"
                checked={isCelsius}
                onChange={onToggle}
            />
            <div className="w-11 h-6 relative bg-gray-200 rounded-full dark:bg-gray-700 transition-colors duration-200 ease-in-out peer-checked:bg-blue-500">
                <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                        isCelsius ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </div>
        </label>
        <span className={`text-sm font-medium ${isCelsius ? 'text-white' : 'text-gray-300'}`}>°C</span>
    </div>
)

interface CurrentWeatherProps {
    data: WeatherData['current'];
    isCelsius: boolean;
    location: string;
    currentTime: string;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, isCelsius, location, currentTime }) => {
    const [hours] = currentTime.split(':').map(Number)
    const isNight = hours < 6 || hours >= 18
    return (
        <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-md">
            <div className="flex items-center">
                <WeatherIcon condition={data.condition} isNight={isNight} className="w-24 h-24 mr-6" />
                <div>
                    <h2 className="text-5xl font-bold w-32">{Math.round(data.temperature)}°{isCelsius ? 'C' : 'F'}</h2>
                    <p className="text-2xl capitalize">{data.condition}</p>
                    <p className="text-lg flex items-center">Precipitation: {data.precipitation}% <Droplets className="w-4 h-4 ml-1" /></p>
                </div>
            </div>
            <div className="text-right">
                <h3 className="text-3xl font-semibold">{location}</h3>
                <p className="text-xl">{currentTime}</p>
            </div>
        </div>
    )
}

interface ForecastDayProps {
    day: NonNullable<WeatherData['forecast']>[number];
    isCelsius: boolean;
}

const ForecastDay: React.FC<ForecastDayProps> = ({ day }) => {
    return (
        <div className="flex flex-col items-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
            <p className="font-semibold text-lg">{day.day}</p>
            <WeatherIcon condition={day.condition} className="w-12 h-12 my-2" />
            <p className="text-lg w-24 text-center">{Math.round(day.highTemp)}° | {Math.round(day.lowTemp)}°</p>
            <p className="text-sm flex items-center justify-center">
                <Droplets className="w-4 h-4 mr-1" />
                {day.precipitation}%
            </p>
        </div>
    )
}

interface ForecastProps {
    data: NonNullable<WeatherData['forecast']>;
    isCelsius: boolean;
}

const Forecast: React.FC<ForecastProps> = ({ data, isCelsius }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
        {data.map((day, index) => (
            <ForecastDay key={index} day={day} isCelsius={isCelsius} />
        ))}

    </div>
)

interface WeatherDetailsProps {
    data: WeatherData['current']
    windSpeedUnit: 'km/h' | 'mph'
}

const WeatherDetails: React.FC<WeatherDetailsProps> = ({ data, windSpeedUnit }) => (
    <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <Droplets className="w-8 h-8 mr-3 text-blue-300" />
            <span className="text-lg">Humidity: {data.humidity}%</span>
        </div>
        <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <Wind className="w-8 h-8 mr-3 text-blue-300" />
            <span className="text-lg">Wind: {Math.round(data.windSpeed)} {windSpeedUnit}</span>
        </div>
        <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <Sunrise className="w-8 h-8 mr-3 text-yellow-300" />
            <span className="text-lg">Sunrise: {data.sunrise}</span>
        </div>
        <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <Sunset className="w-8 h-8 mr-3 text-orange-300" />
            <span className="text-lg">Sunset: {data.sunset}</span>
        </div>
    </div>
)

export default function EnhancedWeatherWidget({ data }: { data: WeatherData }) {
    const [weatherData, setWeatherData] = useState<WeatherData>(data)

    const toggleTemperature = () => {
        setWeatherData(prevData => {
            const newUnit = prevData.temperatureUnit === 'C' ? 'F' : 'C'
            const newWindSpeedUnit = newUnit === 'F' ? 'mph' : 'km/h'
            const convertTemp = (temp: number) =>
                newUnit === 'F' ? (temp * 9/5) + 32 : ((temp - 32) * 5/9)
            const convertWindSpeed = (speed: number) =>
                newWindSpeedUnit === 'mph' ? speed / 1.60934 : speed * 1.60934

            return {
                ...prevData,
                temperatureUnit: newUnit,
                windSpeedUnit: newWindSpeedUnit,
                current: {
                    ...prevData.current,
                    temperature: Math.round(convertTemp(prevData.current.temperature)),
                    windSpeed: Math.round(convertWindSpeed(prevData.current.windSpeed))
                },
                forecast: prevData.forecast?.map(day => ({
                    ...day,
                    highTemp: Math.round(convertTemp(day.highTemp)),
                    lowTemp: Math.round(convertTemp(day.lowTemp))
                }))
            }
        })
    }

    const getBgGradient = (): string => {
        const condition = weatherData.current.condition
        const [hours] = weatherData.currentTime.split(':').map(Number)
        const isNight = hours < 6 || hours >= 18

        switch (condition) {
            case 'clear':
                return isNight ? 'from-indigo-900 to-blue-900' : 'from-blue-400 to-blue-600'
            case 'cloudy':
                return isNight ? 'from-gray-800 to-gray-900' : 'from-gray-400 to-gray-600'
            case 'rainy':
                return isNight ? 'from-blue-900 to-gray-900' : 'from-blue-600 to-gray-600'
            case 'snowy':
                return isNight ? 'from-indigo-900 to-blue-900' : 'from-blue-100 to-blue-300'
            case 'thunderstorm':
                return 'from-gray-900 to-purple-900'
            case 'foggy':
                return isNight ? 'from-gray-800 to-gray-900' : 'from-gray-400 to-gray-600'
            case 'hail':
                return isNight ? 'from-blue-900 to-gray-900' : 'from-blue-500 to-gray-500'
            default:
                return isNight ? 'from-indigo-900 to-blue-900' : 'from-blue-400 to-blue-600'
        }
    }

    return (
        <div className={`p-8 rounded-xl shadow-2xl max-w-4xl mx-auto bg-gradient-to-br ${getBgGradient()} text-white`}>
            <div className="flex justify-between items-start mb-8">
                <h1 className="text-4xl font-bold">Weather Forecast</h1>
                <TemperatureToggle isCelsius={weatherData.temperatureUnit === 'C'} onToggle={toggleTemperature} />
            </div>
            <CurrentWeather
                data={weatherData.current}
                isCelsius={weatherData.temperatureUnit === 'C'}
                location={weatherData.location}
                currentTime={weatherData.currentTime}
            />
            {weatherData.forecast && (
                <Forecast data={weatherData.forecast} isCelsius={weatherData.temperatureUnit === 'C'} />
            )}
            <WeatherDetails data={weatherData.current} windSpeedUnit={weatherData.windSpeedUnit} />
        </div>
    )
}