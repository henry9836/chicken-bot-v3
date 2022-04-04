#!/bin/python3
import pyautogui
import random
import cv2
from time import sleep
from pynput.mouse import Listener

BANNER = s = '''\

    __  __ __  ____   __  __  _    ___  ____       ____   ___    __  __  _    ___  ____  
   /  ]|  |  ||    | /  ]|  |/ ]  /  _]|    \     |    \ /  _]  /  ]|  |/ ]  /  _]|    \ 
  /  / |  |  | |  | /  / |  ' /  /  [_ |  _  |    |  o  )  [_  /  / |  ' /  /  [_ |  D  )
 /  /  |  _  | |  |/  /  |    \ |    _]|  |  |    |   _/    _]/  /  |    \ |    _]|    / 
/   \_ |  |  | |  /   \_ |     \|   [_ |  |  |    |  | |   [_/   \_ |     \|   [_ |    \ 
\     ||  |  | |  \     ||  .  ||     ||  |  |    |  | |     \     ||  .  ||     ||  .  \\
 \____||__|__||____\____||__|\_||_____||__|__|    |__| |_____|\____||__|\_||_____||__|\_|
                                                                                         

'''

def clickAt(x, y, delay):
    pyautogui.click(x, y)
    sleep(delay)

print(BANNER)
print("Mother Hen Is Monitoring For Issues...")

while True:
    ErrorMessage = pyautogui.locateCenterOnScreen('./chicken-vision/opps.png', grayscale=True, confidence=0.9)
    if ErrorMessage != None:
        print("CLUCK I FOUND A BAD CHICKEN!")
        x = ErrorMessage.x
        y = ErrorMessage.y
        pyautogui.moveTo(x, y, duration = 3)
        clickAt(x, y, 0.2)
        pyautogui.hotkey('ctrl', 'r')
        while True:
            print("Waiting on Chicken...")
            PlaceImage = pyautogui.locateCenterOnScreen('./chicken-vision/place.png', region=(x-25, y-100, 200, 50), grayscale=True, confidence=0.9)
            if PlaceImage != None:
                pyautogui.moveTo(PlaceImage.x, PlaceImage.y, duration = 3)
                print("Chicken Fixed Returning To Watch...")
                break
            
            Timer = pyautogui.locateCenterOnScreen('./chicken-vision/timer.png', region=(x-25, y-100, 200, 50), grayscale=True, confidence=0.9)
            if Timer != None:
                pyautogui.moveTo(Timer.x, Timer.y, duration = 3)
                print("Chicken Fixed Returning To Watch...")
                break
            sleep(3)
        exit()
    sleep(1)
