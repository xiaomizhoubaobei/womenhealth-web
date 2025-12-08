'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const weeklyInsights = [
    "您实际上还没有怀孕！受孕通常在月经开始后约2周发生。", // 第1周
    '本周可能会发生受精。您的身体正在为可能的怀孕做准备。', // 第2周
    '受精卵现在是一个囊胚，并正在您的子宫壁上着床。您正式怀孕了！', // 第3周
    '您的宝宝像罂粟籽一样大。形成大脑和脊髓的神经管正在形成。', // 第4周
    '宝宝的心脏开始跳动了！它现在像芝麻一样大。', // 第5周
    '眼睛和鼻孔等面部特征开始形成。您的宝宝有扁豆那么大。', // 第6周
    '本周您的宝宝正在尺寸上翻倍，现在有蓝莓那么大了。他们正在做第一次活动。', // 第7周
    '您的宝宝有芸豆那么大。带蹼的手指和脚趾开始出现。', // 第8周
    '宝宝所有重要的身体部位都已形成。他们现在正式成为胎儿，大小如同一颗葡萄。', // 第9周
    '您的宝宝有金橘那么大。他们的指甲和头发开始形成。', // 第10周
    '您的宝宝大约有无花果那么大。他们正忙着踢腿和伸展。', // 第11周
    '您的宝宝有青柠那么大。他们的反射正在发育，可以张开和合上拳头。', // 第12周
    '第一个孕期结束了！您的宝宝有豆荚那么大，他们的指纹已经形成。', // 第13周
];

/**
 * 怀孕追踪选项卡组件，显示每周的怀孕进程和见解。
 * @returns {JSX.Element} 怀孕追踪选项卡组件。
 */
export function PregnancyTab() {
    const [week, setWeek] = useState(4);
    const pregnancyImage = PlaceHolderImages.find(
        (img) => img.id === 'pregnancy-progress'
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>怀孕进程</CardTitle>
                <CardDescription>
                    通过每周的见解和里程碑来追踪您的怀孕旅程。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="w-full overflow-hidden rounded-lg">
                    {pregnancyImage && (
                        <Image
                            src={pregnancyImage.imageUrl}
                            alt={pregnancyImage.description}
                            width={600}
                            height={400}
                            className="w-full object-cover"
                            data-ai-hint={pregnancyImage.imageHint}
                        />
                    )}
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-semibold">第 {week} 周</h3>
                        <p className="text-muted-foreground">调整滑块查看其他周</p>
                    </div>
                    <Slider
                        defaultValue={[week]}
                        max={40}
                        min={1}
                        step={1}
                        onValueChange={(value) => setWeek(value[0])}
                    />
                </div>
                <Card className="bg-background/50">
                    <CardContent className="p-6">
                        <p>
                            {weeklyInsights[week - 1] ||
                                `第 ${week} 周的见解即将推出！`}
                        </p>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
