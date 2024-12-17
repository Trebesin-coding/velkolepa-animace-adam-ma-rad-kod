/*
    Configuration
*/
// length in seconds of each number in countdown
const cooldownNumberTime = 1


// length in seconds of point add animation
const pointAnimationTime = 0.5


// top position for ball wall bounce
const tableBorderTop = 375


// bottom position for ball wall bounce
const tableBorderBottom = 800   


// racket's top position won't be able to move below this number
const racketMaxTop = 350  


// racket's top position won't be able to move over this number
const racketMaxBottom = 650     


/* how big a rotation on one side of the racket can be 
    (example: hitting ball with top of the racket will result in this number in negative)
    (example: hitting ball with bottom of the racket will result in this number)
*/
const racketHitBallRotationRange = 0.5   


// by how much the ball speed will increase each racket hit
const racketHitBallSpeedBoost = 0.5


// by how much racket position will change every frame when moving
const racketSpeed = 10


// start position for the left serve of the ball (in %)
const leftServeBallPosition = 20


// start position for the right serve of the ball (in %)
const rightServeBallPosition = 80


// the speed that the ball will have at start of each round
const ballStartSpeed = 15


// slows the ball position to simulate table hits 
const simulateBallTableHits = true


// fan animation names and durations
const fanBodyAnimationName = "jooo-middle"
const fanBodyAnimationLength = 0.25

const fanLeftHandAnimationName = "jooo-left"
const fanLeftHandAnimationLength = 0.3
const fanLeftHandConstantAnimationName = "jooo-left-constant"
const fanLeftHandConstantAnimationLength = 0.1

const fanRightHandAnimationName = "jooo-right"
const fanRightHandAnimationLength = 0.3
const fanRightHandConstantAnimationName = "jooo-right-constant"
const fanRightHandConstantAnimationLength = 0.1

/*
*/
const leftRacket = document.querySelector("#left-racket")
const rightRacket = document.querySelector("#right-racket")
const ball = document.querySelector("#ball")
const startButton = document.querySelector("#start-game-button")
const startButtonBackground = document.querySelector("#start-game-blur")
const winner = document.querySelector("#winner")
const leftPoints = document.querySelector("#left-points")
const rightPoints = document.querySelector("#right-points")
const serveInfo = document.querySelector("#serve-info")
const matchPointInfo = document.querySelector("#match-point")
const countdown = document.querySelector("#countdown")
const logo = document.querySelector("#logo")
let countdownBlur = NaN
let startDefaultText = startButton.innerText

let leftPlayerPoints = 0
let rightPlayerPoints = 0

let playerStarts = 0
let randomServe = 1
let startSide = -1
let isServe = false
let serveHit = false

let allowRacketMovement = false

let leftRacketDirection = 0
let leftUp = false
let leftDown = false

let rightRacketDirection = 0
let rightUp = false
let rightDown = false

let ballDirection = [0, 0]
let ballSpeed = ballStartSpeed
let adjustedBallSpeed = ballSpeed
let ballStop = true
let handleBallStop = false
let ballStopTimer = 0

let blueFans = []
let redFans = []
let lastFanSide = "none"

let isRound = false

function getDistance(element0, element1) {
    const rect0 = element0.getBoundingClientRect()
    const rect1 = element1.getBoundingClientRect()

    const diffX = Math.abs((rect0.left + rect0.width/2) - (rect1.left + rect1.width/2))
    const diffY = Math.abs((rect0.top + rect0.height/2) - (rect1.top + rect1.height/2))

    return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2))
}

function getNumberFromPixelString(pixelString) {
    return parseFloat(pixelString.slice(0, pixelString.length - 2))
}

function handleKey(key, isKeyDown) {
    switch (key) {
        case "w":
            leftUp = isKeyDown
            break
        case "W":
            leftUp = isKeyDown
            break
        case "s":
            leftDown = isKeyDown
            break
        case "S":
            leftDown = isKeyDown
        case "ArrowUp":
            rightUp = isKeyDown
            break
        case "ArrowDown":
            rightDown = isKeyDown
            break
        default:
            break
    }
}

function onKeyDown(event) {
    const key = event.key
    
    handleKey(key, true)
}

function onKeyUp(event) {
    const key = event.key

    handleKey(key, false)
}

function getDirectionFromInput(upInput, downInput) {
    if (upInput && !downInput) {
        return -1
    }
    else if (downInput && !upInput) {
        return 1
    }
    else {
        return 0
    }
}

function handleInput() {
    leftRacketDirection = getDirectionFromInput(leftUp, leftDown)
    rightRacketDirection = getDirectionFromInput(rightUp, rightDown)
}

function simulateTableHits() {
    if (!simulateBallTableHits) {
        return
    }

    const racketDistance = getDistance(leftRacket, rightRacket)

    const ballStyle = window.getComputedStyle(ball)
    const ballRect = ball.getBoundingClientRect()
    const ballMiddlePosition = getNumberFromPixelString(ballStyle.left) + ballRect.width / 2

    const leftRacketStyle = window.getComputedStyle(leftRacket)
    const leftRect = leftRacket.getBoundingClientRect()
    const leftRacketMiddlePosition = getNumberFromPixelString(leftRacketStyle.left) + leftRect.width / 2

    const rightRacketStyle = window.getComputedStyle(rightRacket)
    const rightRect = rightRacket.getBoundingClientRect()
    const rightRacketMiddlePosition = getNumberFromPixelString(rightRacketStyle.left) + rightRect.width / 2

    const middlePointPosition = leftRacketMiddlePosition + racketDistance / 2

    const ballToLeft = Math.abs(ballMiddlePosition - leftRacketMiddlePosition)
    const ballToRight = Math.abs(ballMiddlePosition - rightRacketMiddlePosition)
    const ballToMiddle = Math.abs(ballMiddlePosition - middlePointPosition)

    const distanceRange = racketDistance / 2

    if (ballToLeft < ballToRight && ballToLeft < ballToMiddle) {
        if (ballDirection[0] < 0 && ballToLeft < distanceRange || isServe) {
            adjustedBallSpeed = ballSpeed - (ballSpeed / (racketDistance/4)) * ballToLeft
        }
        else {
            adjustedBallSpeed = ballSpeed
        }
    }
    else if (ballToRight < ballToLeft && ballToRight < ballToMiddle) {
        if (ballDirection[0] > 0 && ballToRight < distanceRange || isServe) {
            adjustedBallSpeed = ballSpeed - (ballSpeed / (racketDistance/4)) * ballToRight
        }
        else {
            adjustedBallSpeed = ballSpeed
        }
    }
    else {
        if (ballDirection[0] < 0 && ballToLeft < ballToRight && ballToMiddle < distanceRange || ballDirection[0] > 0 && ballToRight < ballToLeft && ballToMiddle < distanceRange || isServe) {
            adjustedBallSpeed = ballSpeed - (ballSpeed / (racketDistance/4)) * ballToMiddle
        }
        else {
            adjustedBallSpeed = ballSpeed
        }
    }

    if (adjustedBallSpeed < ballSpeed / 2) {
        adjustedBallSpeed = ballSpeed / 2
    }

    let ballScale = (1 / ballSpeed) * adjustedBallSpeed

    ball.style.scale = `${ballScale}`
}

function handleBallVelocity(deltaTime) {
    const ballStyle = window.getComputedStyle(ball)
    const ballRect = ball.getBoundingClientRect()
    let ballTopPosition = getNumberFromPixelString(ballStyle.top)
    let ballLeftPosition = getNumberFromPixelString(ballStyle.left)
    
    ball.style.top = `${ballTopPosition + adjustedBallSpeed * ballDirection[1] * deltaTime}px`
    ball.style.left = `${ballLeftPosition + adjustedBallSpeed * ballDirection[0] * deltaTime}px`

    if (ballTopPosition <= tableBorderTop && ballDirection[1] < 0) {
        ballDirection[1] = Math.abs(ballDirection[1])
    }

    if (ballTopPosition + ballRect.height >= tableBorderBottom && ballDirection[1] > 0) {
        ballDirection[1] = -Math.abs(ballDirection[1])
    }
}

function handleRacketPositions(deltaTime) {
    const leftRacketStyle = window.getComputedStyle(leftRacket)
    const rightRacketStyle = window.getComputedStyle(rightRacket)

    let leftRacketTopPosition = getNumberFromPixelString(leftRacketStyle.top)
    let leftMove = racketSpeed * leftRacketDirection * deltaTime

    if (leftRacketTopPosition + leftMove < racketMaxTop) {
        leftRacketTopPosition = racketMaxTop
        leftMove = 0
    }
    else if (leftRacketTopPosition + leftMove > racketMaxBottom) {
        leftRacketTopPosition = racketMaxBottom
        leftMove = 0
    }

    let rightRacketTopPosition = getNumberFromPixelString(rightRacketStyle.top)
    let rightMove = racketSpeed * rightRacketDirection * deltaTime

    if (rightRacketTopPosition + rightMove < racketMaxTop) {
        rightRacketTopPosition = racketMaxTop
        rightMove = 0
    }
    else if (rightRacketTopPosition + rightMove > racketMaxBottom) {
        rightRacketTopPosition = racketMaxBottom
        rightMove = 0
    }

    if (allowRacketMovement) {
        leftRacket.style.top = `${leftRacketTopPosition + leftMove}px`
        rightRacket.style.top = `${rightRacketTopPosition + rightMove}px`
    }
}

function getBallHitRotation(distanceToTop) {
    return -racketHitBallRotationRange + (distanceToTop / (150 / (racketHitBallRotationRange * 2)))
}

function handleBallHits() {
    const ballStyle = window.getComputedStyle(ball)
    const ballRect = ball.getBoundingClientRect()
    let ballTopPosition = getNumberFromPixelString(ballStyle.top)
    let ballLeftPosition = getNumberFromPixelString(ballStyle.left)

    const leftRacketStyle = window.getComputedStyle(leftRacket)
    const leftRect = leftRacket.getBoundingClientRect()
    let leftRacketTopPosition = getNumberFromPixelString(leftRacketStyle.top)
    let leftRacketBottomPosition = leftRacketTopPosition + leftRect.height
    let leftRacketLeftPosition = getNumberFromPixelString(leftRacketStyle.left)
    let leftRacketRightPosition = leftRacketLeftPosition + leftRect.width
    
    const rightRacketStyle = window.getComputedStyle(rightRacket)
    const rightRect = rightRacket.getBoundingClientRect()
    let rightRacketTopPosition = getNumberFromPixelString(rightRacketStyle.top)
    let rightRacketBottomPosition = rightRacketTopPosition + rightRect.height
    let rightRacketLeftPosition = getNumberFromPixelString(rightRacketStyle.left)
    let rightRacketRightPosition = rightRacketLeftPosition + rightRect.width

    if (leftRacketRightPosition >= ballLeftPosition && leftRacketTopPosition - ballRect.height <= ballTopPosition && leftRacketBottomPosition - 90 >= ballTopPosition) {
        let distanceToTop = Math.abs(leftRacketTopPosition - ballTopPosition)
        let rotation = getBallHitRotation(distanceToTop)

        ballDirection = [1, rotation]
        ballSpeed += racketHitBallSpeedBoost

        if (!serveHit) {
            isServe = false
        }
        else {
            serveHit = false
        }
    }

    if (rightRacketLeftPosition <= ballLeftPosition && rightRacketTopPosition - ballRect.height <= ballTopPosition && rightRacketBottomPosition - 90 >= ballTopPosition) {
        let distanceToTop = Math.abs(rightRacketTopPosition - ballTopPosition)
        let rotation = getBallHitRotation(distanceToTop)

        ballDirection = [-1, rotation]
        ballSpeed += racketHitBallSpeedBoost
        
        if (!serveHit) {
            isServe = false
        }
        else {
            serveHit = false
        }
    }

    if (leftRacketLeftPosition > ballLeftPosition && allowRacketMovement) {
        ballDirection = [0, 0]
        allowRacketMovement = false
        rightPlayerPoints++
        rightPoints.style.animation = `countdown-animation ${pointAnimationTime}s alternate 2`
        endRound("Right player")
    }

    if (rightRacketRightPosition < ballLeftPosition + ballRect.width && allowRacketMovement) {
        ballDirection = [0, 0]
        allowRacketMovement = false
        leftPlayerPoints++
        leftPoints.style.animation = `countdown-animation ${pointAnimationTime}s alternate 2`
        endRound("Left player")
    }
}

function countdownAnimationEnd() {
    switch (countdown.innerText) {
        case "3":
            countdown.innerText = "2"
            countdown.style.animation = "none"
            setTimeout(() => {
                countdown.style.animation = `countdown-animation ${cooldownNumberTime/2}s alternate 2`
            }, 10)
            break
        case "2":
            countdown.innerText = "1"
            countdown.style.animation = "none"
            setTimeout(() => {
                countdown.style.animation = `countdown-animation ${cooldownNumberTime/2}s alternate 2`
            }, 10)
            break
        case "1":
            countdown.innerText = "Go!"
            countdown.style.animation = "none"
            setTimeout(() => {
                countdown.style.animation = `countdown-animation ${cooldownNumberTime/2}s alternate 2`
            }, 10)
            break
        default:
            countdown.innerText = "3"
            countdown.style.animation = "none"
            countdown.style.display = "none"
            countdownBlur.remove()
            countdown.removeEventListener("click", countdownAnimationEnd)
    
            logo.style.width = "8%"

            enableBall()

            break
    }
}

function startRound() {
    isRound = true

    countdown.style.display = "block"
    countdown.style.animation = `countdown-animation ${cooldownNumberTime/2}s alternate 2`

    countdownBlur = document.createElement("div")
    countdownBlur.classList.add("blur")
    document.body.append(countdownBlur)

    countdown.innerText = "3"

    countdown.addEventListener("animationend", countdownAnimationEnd)
}

function endRound(winnerName) {
    leftRacket.style.top = "45%"
    rightRacket.style.top = "45%"

    ball.style.visibility = "hidden"

    winner.style.display = "block"

    if (winnerName === "Left player") {
        activateFans("left", true)
    }
    else if (winnerName === "Right player") {
        activateFans("right", true)
    }

    if (leftPlayerPoints === 11 && rightPlayerPoints < 10 || rightPlayerPoints === 11 && leftPlayerPoints <= 10 || Math.abs(leftPlayerPoints - rightPlayerPoints) > 1 && rightPlayerPoints >= 10 && leftPlayerPoints >= 10) {
        winner.innerText = winnerName + " is the winner!"
        displayPoints()
        rightPoints.style.animation = "none"
        leftPoints.style.animation = "none"

        return
    }
    else {
        winner.innerText = winnerName
    }

    displayPoints()

    setTimeout(() => {
        winner.style.display = "none"
        rightPoints.style.animation = "none"
        leftPoints.style.animation = "none"

        setNextServePlayer()

        let matchPoint = isMatchPoint()
        if (matchPoint[0]) {
            matchPointInfo.innerText = matchPoint[1] + " matchpoint!"
            matchPointInfo.style.display = "block"
        }

        logo.style.width = "15%"

        serveInfo.style.display = "block"

        startButton.innerText = "Next serve"
        startButton.style.display = "block"
        startButtonBackground.style.display = "block"

        isRound = false
    }, 2000)
}

function setNextServePlayer() {
    let prevStartSide = startSide

    if (playerStarts < 2) {
        playerStarts++

        startSide = -1 * randomServe
    }
    else if (playerStarts < 4) {
        playerStarts++

        startSide = 1 * randomServe
    }
    else {
        playerStarts = 1

        startSide = -1 * randomServe
    }

    if (leftPlayerPoints >= 10 && rightPlayerPoints >= 10) {
        if (prevStartSide === -1) {
            startSide = 1
        }
        else [
            startSide = -1
        ]
    }

    if (startSide === -1) {
        serveInfo.classList = ["left-serve-pos"]
    }
    else {
        serveInfo.classList = ["right-serve-pos"]
    }
}

function enableBall() {
    if (startSide === -1) {
        ball.style.left = `${leftServeBallPosition}%`
    }
    else {
        ball.style.left = `${rightServeBallPosition}%`
    }
    
    ball.style.top = "50%"

    isServe = true
    serveHit = true
    ballSpeed = ballStartSpeed
    adjustedBallSpeed = ballSpeed
    ballDirection = [startSide, 0]

    ball.style.visibility = "visible"
    allowRacketMovement = true

    serveInfo.style.display = "none"
    matchPointInfo.style.display = "none"
}

function isMatchPoint() {
    if (leftPlayerPoints === 10 && rightPlayerPoints < 10) {
        return [true, "Left player"]
    }
    else if (rightPlayerPoints === 10 && leftPlayerPoints < 10) {
        return [true, "Right player"]
    }
    else if (rightPlayerPoints >= 10 && leftPlayerPoints >= 10) {
        if (leftPlayerPoints > rightPlayerPoints) {
            return [true, "Left player"]
        }
        else if (rightPlayerPoints > leftPlayerPoints) {
            return [true, "Right player"]
        }
    }

    return [false, "None"]
}

function displayPoints() {
    leftPoints.innerText = leftPlayerPoints
    rightPoints.innerText = rightPlayerPoints
}

function activateFans(side, state) {
    if (side === "left") {
        blueFans.forEach(blueFan => {
            const classList = blueFan.classList

            if (classList.contains("blue-fan")) {
                if (state) {
                    blueFan.style.animation = `${fanBodyAnimationName} ${fanBodyAnimationLength}s infinite alternate ease-in-out`
                }
                else {
                    blueFan.style.animation = "none"
                }
            } 
            else if (classList.contains("left-hand-blue")) {
                if (state) {
                    blueFan.style.animation = `${fanLeftHandAnimationName} ${fanLeftHandAnimationLength}s 1 alternate ease-in-out`

                    const eventAction = () => {
                        blueFan.style.animation = `${fanLeftHandConstantAnimationName} ${fanLeftHandConstantAnimationLength}s infinite alternate ease-in-out`
                        blueFan.removeEventListener("animationend", eventAction)
                    }

                    blueFan.addEventListener("animationend", eventAction)
                }
                else {
                    blueFan.style.animation = `${fanLeftHandAnimationName} ${fanLeftHandAnimationLength}s 1 ease-in-out reverse`
                    
                    const eventAction = () => {
                        blueFan.style.animation = "none"
                        blueFan.removeEventListener("animationend", eventAction)
                    }

                    blueFan.addEventListener("animationend", eventAction)
                }
            }
            else if (classList.contains("right-hand-blue")) {
                if (state) {
                    blueFan.style.animation = `${fanRightHandAnimationName} ${fanRightHandAnimationLength}s 1 alternate ease-in-out`

                    const eventAction = () => {
                        blueFan.style.animation = `${fanRightHandConstantAnimationName} ${fanRightHandConstantAnimationLength}s infinite alternate ease-in-out`
                        blueFan.removeEventListener("animationend", eventAction)
                    }

                    blueFan.addEventListener("animationend", eventAction)
                }
                else {
                    blueFan.style.animation = `${fanRightHandAnimationName} ${fanRightHandAnimationLength}s 1 ease-in-out reverse`

                    const eventAction = () => {
                        blueFan.style.animation = "none"
                        blueFan.removeEventListener("animationend", eventAction)
                    }

                    blueFan.addEventListener("animationend", eventAction)
                }
            } 
        })
    }
    else if (side === "right") {
        redFans.forEach(redFan => {
            const classList = redFan.classList

            if (classList.contains("red-fan")) {
                if (state) {
                    redFan.style.animation = `${fanBodyAnimationName} ${fanBodyAnimationLength}s infinite alternate ease-in-out`
                }
                else {
                    redFan.style.animation = "none"
                }
            } 
            else if (classList.contains("left-hand-red")) {
                if (state) {
                    redFan.style.animation = `${fanLeftHandAnimationName} ${fanLeftHandAnimationLength}s 1 alternate ease-in-out`

                    const eventAction = () => {
                        redFan.style.animation = `${fanLeftHandConstantAnimationName} ${fanLeftHandConstantAnimationLength}s infinite alternate ease-in-out`
                        redFan.removeEventListener("animationend", eventAction)
                    }

                    redFan.addEventListener("animationend", eventAction)
                }
                else {
                    redFan.style.animation = `${fanLeftHandAnimationName} ${fanLeftHandAnimationLength}s 1 ease-in-out reverse`

                    const eventAction = () => {
                        redFan.style.animation = "none"
                        redFan.removeEventListener("animationend", eventAction)
                    }

                    redFan.addEventListener("animationend", eventAction)
                }
            }
            else if (classList.contains("right-hand-red")) {
                if (state) {
                    redFan.style.animation = `${fanRightHandAnimationName} ${fanRightHandAnimationLength}s 1 alternate ease-in-out`

                    const eventAction = () => {
                        redFan.style.animation = `${fanRightHandConstantAnimationName} ${fanRightHandConstantAnimationLength}s infinite alternate ease-in-out`
                        redFan.removeEventListener("animationend", eventAction)
                    }

                    redFan.addEventListener("animationend", eventAction)
                }
                else {
                    redFan.style.animation = `${fanRightHandAnimationName} ${fanRightHandAnimationLength}s 1 ease-in-out reverse`

                    const eventAction = () => {
                        redFan.style.animation = "none"
                        redFan.removeEventListener("animationend", eventAction)
                    }

                    redFan.addEventListener("animationend", eventAction)
                }
            } 
        })
    }

    lastFanSide = side
}

let lastTime = 0
function mainLoop(time) {
    const deltaTime = (time - lastTime) / 10
    lastTime = time

    handleInput()
    handleRacketPositions(deltaTime)
    handleBallVelocity(deltaTime)
    handleBallHits()
    simulateTableHits()

    window.requestAnimationFrame(mainLoop)
}

function duplicateFans(middleFan, side) {
    const body = document.body

    const leftFan = middleFan.cloneNode(true)
    leftFan.removeAttribute("id")
    body.append(leftFan)

    for (let i = 0; i < leftFan.children.length; i++) {
        const childElement = leftFan.children[i]

        if (side === "left") {
            childElement.style.left = "15%"
            blueFans.push(childElement)
        }
        else if (side === "right") {
            childElement.style.right = "15%"
            redFans.push(childElement)
        }

        childElement.style.scale = "1.05"
    }

    const rightFan = middleFan.cloneNode(true)
    rightFan.removeAttribute("id")
    body.append(rightFan)

    for (let i = 0; i < rightFan.children.length; i++) {
        const childElement = rightFan.children[i]

        if (side === "left") {
            childElement.style.left = "37.4%"
            blueFans.push(childElement)
        }
        else if (side === "right") {
            childElement.style.right = "37.4%"
            redFans.push(childElement)
        }

        childElement.style.scale = "1.05"
    }

    for (let i = 0; i < middleFan.children.length; i++) {
        const childElement = middleFan.children[i]

        if (side === "left") {
            blueFans.push(childElement)
        }
        else if (side === "right") {
            redFans.push(childElement)
        }
    }
}

function createFans() {
    const blueFan = document.querySelector("#blue-fans")
    const redFan = document.querySelector("#red-fans")

    duplicateFans(blueFan, "left")
    duplicateFans(redFan, "right")
}

function startClick() {
    startButton.style.display = "none"
    startButtonBackground.style.display = "none"

    serveInfo.style.display = "block"

    if (startButton.innerText === startDefaultText) {
        setNextServePlayer()
    }

    if (lastFanSide !== "none") {
         activateFans(lastFanSide, false)
    }

    startRound()
}

function setup() {
    ball.style.visibility = "hidden"

    let randomServerNumber = Math.floor(Math.random() * 2)
    if (randomServerNumber === 0) {
        randomServe = -1
        serveInfo.classList = ["right-serve-pos"]
    }
    else {
        serveInfo.classList = ["left-serve-pos"]
    }

    startButton.addEventListener("click", () => {
        startClick()
    })

    createFans()

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("keyup", onKeyUp)

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !isRound) {
            startClick()
        }  
    })
    
    window.requestAnimationFrame(mainLoop)
}

setup()