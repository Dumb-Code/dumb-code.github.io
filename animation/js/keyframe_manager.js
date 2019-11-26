import { PlayState } from "../js/animations.js";

const sectionWidth = 20
const ticksPerSection = 1 
const pixelsPerTick = sectionWidth / ticksPerSection
const resolution = 10


export class KeyframeManger {

    constructor(keyframeBoard) {

        this.lables = new Map()
        this.playstate = new PlayState()

        this.board = keyframeBoard

        const createContainer = (classname, parent = this.board) => {
            let div = document.createElement("div")
            div.draggable = false
            div.className = classname
            parent.appendChild(div)
            return div
        }
        
        this.playbackMarker = createContainer("keyframe-playback-marker tooltip")
        this.labelBoard = createContainer("keyframe-board-labels")
        this.entryBoard = createContainer("keyframe-board-entries")

        this.scroll = 0

        this.updateLables()

        let mouseMove = e => {
            if(this.selectedKeyFrame && e.shiftKey) {
                this.selectedKeyFrame.moved = true
                let pixelDiff = e.screenX - this.xHold
                this.xHold = e.screenX
                this.selectedKeyFrame.startTimeNoSnap += pixelDiff / pixelsPerTick

                this.selectedKeyFrame.startTime = this.selectedKeyFrame.startTimeNoSnap

                const snappingTicks = 0.5
                this.display.animationHandler.keyframes.filter(kf => kf != this.selectedKeyFrame).forEach(kf =>{
                    if(Math.abs(this.selectedKeyFrame.startTimeNoSnap - (kf.startTime + kf.duration)) < snappingTicks) {
                        this.selectedKeyFrame.startTime = kf.startTime + kf.duration
                    } else if(Math.abs(this.selectedKeyFrame.startTimeNoSnap + this.selectedKeyFrame.duration - (kf.startTime)) < snappingTicks) {
                        this.selectedKeyFrame.startTime = kf.startTime - this.selectedKeyFrame.duration
                    }
                })

                this.selectedKeyFrame.updateInfo()
                this.updateKeyFrame(this.selectedKeyFrame)
                this.display.animationHandler.keyframesDirty()
            } else {
                this.scroll -= e.screenX - this.xHold
                this.scroll = this.scroll < 0 ? 0 : this.scroll
                this.xHold = e.screenX
                this.updateScroll()
            }
        }

        let markerMouseMove = e => {
            let off = e.clientX - this.getLeft()
            let ticksoff = off / pixelsPerTick
            let ticks = ticksoff + this.scroll / pixelsPerTick;
            this.playstate.ticks = ticks
            this.updateTooltipTicks()
            this.ensureFramePosition()
        }
        
        this.entryBoard.addEventListener("mousedown", e => {
            e.preventDefault ? e.preventDefault() : e.returnValue = false
            this.xHold = e.screenX
            if(this.selectedKeyFrame) {
                this.selectedKeyFrame.startTimeNoSnap = this.selectedKeyFrame.startTime
                this.selectedKeyFrame.mouseDownStartTimeNoSnap = this.selectedKeyFrame.startTime

                this.selectedKeyFrame.durationNoSnap = this.selectedKeyFrame.duration
                this.selectedKeyFrame.mouseDownDurationNoSnap = this.selectedKeyFrame.duration
            }
            this.entryBoard.addEventListener("mousemove", mouseMove, false);
        }, false);

        this.playbackMarker.addEventListener("mousedown", e => {
            e.preventDefault ? e.preventDefault() : e.returnValue = false
            markerMouseMove.enabled = true
            document.addEventListener("mousemove", markerMouseMove, false);
        }, false);

        this.playbackMarker.addEventListener("mouseenter", e => {
            this.playbackMarker.classList.toggle("is-tooltip-active", true)
            this.updateTooltipTicks()
        }, false)

        this.playbackMarker.addEventListener("mouseleave", e => {
            if(!markerMouseMove.enabled) {
                this.playbackMarker.classList.toggle("is-tooltip-active", false)
            }
        }, false)
        
        document.addEventListener("mouseup", () => {

            if(this.selectedKeyFrame) {
                if(this.selectedKeyFrame.moved) { 
                    let startTime = this.selectedKeyFrame.mouseDownStartTimeNoSnap
                    let duration = this.selectedKeyFrame.mouseDownDurationNoSnap

                    let startTimeEnd = this.selectedKeyFrame.startTime
                    let durationEnd = this.selectedKeyFrame.duration

                    daeHistory.addAction(() => {
                        this.selectedKeyFrame.startTime = startTime
                        this.selectedKeyFrame.duration = duration

                        this.selectedKeyFrame.updateInfo()
                        this.updateKeyFrame(this.selectedKeyFrame)
                        this.display.animationHandler.keyframesDirty()
                    }, () => {
                        this.selectedKeyFrame.startTime = startTimeEnd
                        this.selectedKeyFrame.duration = durationEnd

                        this.selectedKeyFrame.updateInfo()
                        this.updateKeyFrame(this.selectedKeyFrame)
                        this.display.animationHandler.keyframesDirty()
                    })
  
                }
                this.selectedKeyFrame.moved = false
            }
            

            this.entryBoard.removeEventListener("mousemove", mouseMove, false)
            document.removeEventListener("mousemove", markerMouseMove, false)
            markerMouseMove.enabled = false
            this.playbackMarker.classList.toggle("is-tooltip-active", false)

        }, false);

        window.addEventListener("resize", () => this.updateScroll())
    }

    updateTooltipTicks() {
        let ticks = this.playstate.ticks
        let rounded = Math.round(ticks * 10) / 10;
        this.playbackMarker.dataset.tooltip = `${rounded} ticks`
    }

    updateScroll() {
        this.entryBoard.style.backgroundPositionX = -this.scroll + "px"
        this.updateLables()
        this.reframeKeyframes()
    }

    reframeKeyframes() {
        if(this.display.animationHandler) {
            this.display.animationHandler.keyframes.forEach(kf => this.updateKeyFrame(kf))
        }
    }

    setupSelectedPose() {
        if(this.selectedKeyFrame && !this.playstate.playing) {
            this.display.animationHandler.animationMap.forEach((cube, cubename) => {
                let irot = this.selectedKeyFrame.getRotation(cubename)
                cube.rotation.set(irot[0] * Math.PI / 180, irot[1] * Math.PI / 180, irot[2] * Math.PI / 180)

                let ipos = this.selectedKeyFrame.getPosition(cubename)
                cube.position.set(ipos[0], ipos[1], ipos[2])

            })
        }
    }

    ensureFramePosition() {
        let playstate = this.playstate;

        let ticks = playstate.ticks

        let left = this.scroll / pixelsPerTick

        let conatainerWidth = this.board.clientWidth
        let ticksInContainer = conatainerWidth / pixelsPerTick

        let xpos = 0
        //Not on screen, we need to move screen to fit
        if(playstate.playing && (ticks < left || ticks > left + ticksInContainer)) {
            this.scroll = ticks * pixelsPerTick
            this.updateScroll()
        } else {
            xpos = ((ticks - left) / ticksInContainer) * this.board.clientWidth
        }

        this.playbackMarker.style.left = this.getLeft() + xpos + "px"
    }

    updateKeyFrame(kf) {
        if(!kf.element) {

            let wrapper = document.createElement("div")
            wrapper.draggable = false
            this.entryBoard.appendChild(wrapper)
            wrapper.className = "keyframe-entry-wrapper"

            let inner = document.createElement("div")
            inner.draggable = false
            wrapper.appendChild(inner)
            inner.className = "keyframe-entry"

            let marker = document.createElement("div")
            marker.draggable = false
            inner.appendChild(marker)
            marker.className = "keyframe-entry-marker"

            kf.hoverChange = (hover) => {
                wrapper.classList.toggle("is-hovered", hover)
                inner.classList.toggle("is-hovered", hover)
            }

            kf.updateInfo = () => {
                document.getElementById("editor-kf-startime").value = kf.startTime
                document.getElementById("editor-kf-duration").value = kf.duration
            }

            kf.selectChange = (select, recursive = true) => {
                wrapper.style.zIndex = select ? "100" : "auto"
                inner.classList.toggle("is-selected", select)
                marker.classList.toggle("is-selected", select)

                if(select) {
                    kf.updateInfo()
                    if(recursive && this.selectedKeyFrame && this.selectedKeyFrame != kf) {
                        this.selectedKeyFrame.selectChange(false, false)
                    }
                    this.selectedKeyFrame = kf

                } else {
                    this.selectedKeyFrame = undefined
                }
            }
            
            marker.onmousedown = () => {
                let oldKf = this.selectedKeyFrame
                daeHistory.addAction(() => {
                    if(oldKf) {
                        oldKf.selectChange(true)
                    } else {
                        kf.selectChange(false)
                    }
                }, () => kf.selectChange(true))
                kf.selectChange(true)
            }
            marker.onmouseenter = () => {
                if(!this.selectedKeyFrame) {
                    kf.hoverChange(true)
                }
            }
            marker.onmouseleave = () => kf.hoverChange(false)
            kf.element = wrapper

        }
        
        let left = kf.startTime * pixelsPerTick

        kf.element.style.width = kf.duration * pixelsPerTick + "px"
        kf.element.style.left = this.getLeft() + left - this.scroll + "px"
    }

    updateLables() {
        let left = this.scroll / pixelsPerTick
        let right = left + (this.board.clientWidth / pixelsPerTick)

        let resolutionStart = left - (left % resolution) + resolution
        let resolutionEnd = right - (right % resolution)

        if(left % resolution == 0) {
            resolutionStart = left
        }

        let acceptedLables = []
        for(let res = resolutionStart; res <= resolutionEnd; res += resolution) {
            let label
            if(this.lables.has(res)) {
                label = this.lables.get(res)
            } else {
                label = document.createElement("label")
                label.draggable = false
                label.className = "keyframe-board-label disable-select"
                label.innerHTML = res
                this.lables.set(res, label)
                this.labelBoard.appendChild(label)
            }
            label.style.left = this.getLeft() + (res * pixelsPerTick) - this.scroll - label.clientWidth/2 + "px"
            acceptedLables.push(res)
        }
        for (const label of this.lables.keys()) {
            if(!acceptedLables.includes(label)) {
                this.labelBoard.removeChild(this.lables.get(label))
                this.lables.delete(label)
            }
        } 
    }

    getLeft() {
        return this.entryBoard.getBoundingClientRect().x
    }
}